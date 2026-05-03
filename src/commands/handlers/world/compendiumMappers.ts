import type { CompendiumIndexEntry } from '@/commands/types';

export interface RawIndexEntry {
  _id?: string;
  id?: string;
  name?: string;
  img?: string | null;
  type?: string | null;
  [path: string]: unknown;
}

export function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  if (path.length === 0) return undefined;

  if (Object.prototype.hasOwnProperty.call(obj, path)) {
    return obj[path];
  }

  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

export function mapIndexEntryToCommand(
  entry: RawIndexEntry,
  requestedFields?: string[]
): CompendiumIndexEntry {
  const id = entry._id ?? entry.id ?? '';
  const name = entry.name ?? '';
  const img = entry.img !== undefined && entry.img !== null ? entry.img : null;
  const type = entry.type !== undefined && entry.type !== null ? entry.type : null;

  const result: CompendiumIndexEntry = {
    id,
    name,
    img,
    type
  };

  if (requestedFields !== undefined && requestedFields.length > 0) {
    const fields: Record<string, unknown> = {};
    for (const field of requestedFields) {
      fields[field] = getNestedValue(entry as Record<string, unknown>, field);
    }
    result.fields = fields;
  }

  return result;
}
