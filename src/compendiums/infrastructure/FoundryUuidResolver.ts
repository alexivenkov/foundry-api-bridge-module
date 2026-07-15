import type { ResolvedUuidRecord, UuidResolver } from '@/compendiums/domain';

interface FoundryResolvedDocument {
  uuid: string;
  documentName: string;
  id: string;
  name?: string | null;
  type?: string;
  img?: string | null;
  pack?: string | null;
  parent?: { uuid: string } | null;
  toObject(source?: boolean): Record<string, unknown>;
}

export type FromUuidFn = (uuid: string) => Promise<unknown>;

function defaultFromUuid(uuid: string): Promise<unknown> {
  const fromUuid = (globalThis as { fromUuid?: FromUuidFn }).fromUuid;
  if (typeof fromUuid !== 'function') {
    return Promise.resolve(null);
  }
  return fromUuid(uuid);
}

export class FoundryUuidResolver implements UuidResolver {
  constructor(private readonly fromUuid: FromUuidFn = defaultFromUuid) {}

  async resolve(uuid: string): Promise<ResolvedUuidRecord | null> {
    let resolved: unknown;
    try {
      resolved = await this.fromUuid(uuid);
    } catch {
      // Malformed UUIDs may throw inside core parsing on some versions —
      // an unresolvable UUID is a domain outcome, not an infrastructure crash.
      return null;
    }

    if (!isResolvedDocument(resolved)) {
      return null;
    }

    return {
      uuid: resolved.uuid,
      documentName: resolved.documentName,
      id: resolved.id,
      name: resolved.name ?? null,
      type: resolved.type ?? null,
      img: resolved.img ?? null,
      pack: resolved.pack ?? null,
      parentUuid: resolved.parent?.uuid ?? null,
      data: resolved.toObject()
    };
  }
}

function isResolvedDocument(value: unknown): value is FoundryResolvedDocument {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const candidate = value as { toObject?: unknown; uuid?: unknown; documentName?: unknown };
  return (
    typeof candidate.toObject === 'function' &&
    typeof candidate.uuid === 'string' &&
    typeof candidate.documentName === 'string'
  );
}
