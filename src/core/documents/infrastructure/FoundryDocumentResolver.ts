import type { DocumentGlobalsProvider, FoundryDocument } from './foundryDocumentTypes';

function isFoundryDocument(value: unknown): value is FoundryDocument {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const candidate = value as { uuid?: unknown; documentName?: unknown; _source?: unknown; schema?: unknown };
  return (
    typeof candidate.uuid === 'string' &&
    typeof candidate.documentName === 'string' &&
    candidate._source !== null &&
    typeof candidate._source === 'object' &&
    candidate.schema !== null &&
    typeof candidate.schema === 'object'
  );
}

/**
 * Resolves a uuid the way the core does (`foundry.utils.fromUuid`, which loads compendium documents and resolves
 * embedded and token-actor paths). A malformed uuid makes some core versions throw: that is "not found" too.
 */
export class FoundryDocumentResolver {
  constructor(private readonly globals: DocumentGlobalsProvider) {}

  async resolve(uuid: string): Promise<FoundryDocument | null> {
    const globals = this.globals();
    const fromUuid = globals.foundry?.utils?.fromUuid ?? globals.fromUuid;
    if (fromUuid === undefined) {
      return null;
    }
    let resolved: unknown;
    try {
      resolved = await fromUuid(uuid);
    } catch {
      return null;
    }
    return isFoundryDocument(resolved) ? resolved : null;
  }
}
