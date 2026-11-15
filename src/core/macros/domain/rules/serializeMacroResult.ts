export const MACRO_RESULT_MAX_BYTES = 262_144;

const MAX_DEPTH = 32;
const CIRCULAR = '[Circular]';
const TOO_DEEP = '[MaxDepth]';
const DROPPED: unique symbol = Symbol('dropped');

export interface SerializedMacroResult {
  result?: unknown;
  resultTruncated?: true;
  resultBytes?: number;
}

interface DocumentLike {
  documentName: string;
  uuid: string;
  id?: unknown;
  name?: unknown;
}

function isDocumentLike(value: object): value is DocumentLike {
  const candidate = value as { documentName?: unknown; uuid?: unknown };
  return typeof candidate.documentName === 'string' && typeof candidate.uuid === 'string';
}

function hasToJson(value: object): value is { toJSON(): unknown } {
  return typeof (value as { toJSON?: unknown }).toJSON === 'function';
}

function documentReference(doc: DocumentLike): Record<string, unknown> {
  const reference: Record<string, unknown> = {
    documentName: doc.documentName,
    id: typeof doc.id === 'string' ? doc.id : null,
    uuid: doc.uuid
  };
  if (typeof doc.name === 'string') {
    reference['name'] = doc.name;
  }
  return reference;
}

function convert(value: unknown, path: Set<object>, depth: number): unknown {
  if (typeof value === 'object') {
    return value === null ? null : convertObject(value, path, depth);
  }
  if (typeof value === 'boolean' || typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return DROPPED;
}

function convertObject(value: object, path: Set<object>, depth: number): unknown {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }
  if (value instanceof Error) {
    return { name: value.name, message: value.message };
  }
  if (isDocumentLike(value)) {
    return documentReference(value);
  }
  if (path.has(value)) {
    return CIRCULAR;
  }
  if (depth >= MAX_DEPTH) {
    return TOO_DEEP;
  }
  path.add(value);
  try {
    return convertContainer(value, path, depth + 1);
  } finally {
    path.delete(value);
  }
}

function convertContainer(value: object, path: Set<object>, depth: number): unknown {
  if (value instanceof Map) {
    const map: Map<unknown, unknown> = value;
    return convertArray(Array.from(map.values()), path, depth);
  }
  if (value instanceof Set) {
    const set: Set<unknown> = value;
    return convertArray(Array.from(set), path, depth);
  }
  if (hasToJson(value)) {
    const json = toJsonOf(value);
    if (json !== value) {
      return convert(json, path, depth - 1);
    }
  }
  if (Array.isArray(value)) {
    const items: readonly unknown[] = value;
    return convertArray(items, path, depth);
  }
  return convertRecord(value as Record<string, unknown>, path, depth);
}

function toJsonOf(value: { toJSON(): unknown }): unknown {
  try {
    return value.toJSON();
  } catch {
    return value;
  }
}

function convertArray(items: readonly unknown[], path: Set<object>, depth: number): unknown[] {
  return items.map(item => {
    const converted = convert(item, path, depth);
    return converted === DROPPED ? null : converted;
  });
}

function convertRecord(value: Record<string, unknown>, path: Set<object>, depth: number): Record<string, unknown> {
  const record: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    const converted = convert(item, path, depth);
    if (converted !== DROPPED) {
      record[key] = converted;
    }
  }
  return record;
}

export function serializeMacroResult(value: unknown): SerializedMacroResult {
  const result = convert(value, new Set(), 0);
  if (result === DROPPED) {
    return {};
  }
  const resultBytes = new TextEncoder().encode(JSON.stringify(result)).length;
  if (resultBytes > MACRO_RESULT_MAX_BYTES) {
    return { resultTruncated: true, resultBytes };
  }
  return { result };
}
