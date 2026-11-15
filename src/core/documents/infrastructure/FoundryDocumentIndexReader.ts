import type { DocumentIndexReader, DocumentSearchHit, DocumentSearchQuery, SearchSource } from '@/core/documents/domain';
import type { DocumentGlobalsProvider, FoundryDocumentIndex, FoundryWordTreeEntry } from './foundryDocumentTypes';

function sourceFilter(source: SearchSource): ((entry: FoundryWordTreeEntry) => boolean) | undefined {
  switch (source) {
    case 'world':
      return (entry) => stringOrNull(entry.pack) === null;
    case 'compendiums':
      return (entry) => stringOrNull(entry.pack) !== null;
    case 'all':
      return undefined;
  }
}

function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function toHit(entry: FoundryWordTreeEntry): DocumentSearchHit | null {
  const record = entry.entry;
  const id = stringOrNull(record._id) ?? stringOrNull(record.id);
  if (id === null) {
    return null;
  }
  const packId = stringOrNull(entry.pack);
  return {
    // Foundry 13 indexes pack entries under the legacy `Compendium.<pack>.<id>` form; the canonical one names the type.
    uuid: packId !== null ? `Compendium.${packId}.${entry.documentName}.${id}` : entry.uuid,
    id,
    name: typeof record.name === 'string' ? record.name : '',
    documentType: entry.documentName,
    subtype: stringOrNull(record.type),
    packId,
    folderId: packId !== null ? stringOrNull(record.folder) : stringOrNull(record._source?.['folder']),
    parentUuid: packId !== null ? null : (record.parent?.uuid ?? null)
  };
}

/**
 * Anti-corruption layer over `game.documentIndex` (`DocumentIndex#lookup`). Foundry 13 keys each document by its
 * whole lower-cased name; Foundry 14 by each word of it and requires every query word to match. The limit counts
 * the entries that pass `filterEntries` per document type, so the source filter goes there, not after the lookup.
 */
export class FoundryDocumentIndexReader implements DocumentIndexReader {
  constructor(private readonly globals: DocumentGlobalsProvider) {}

  isAvailable(): boolean {
    return typeof this.index()?.lookup === 'function';
  }

  async search(query: DocumentSearchQuery): Promise<readonly DocumentSearchHit[]> {
    const index = this.index();
    if (index === undefined) {
      return [];
    }
    if (index.ready) {
      await index.ready;
    }
    const filterEntries = sourceFilter(query.source);
    const grouped = index.lookup(query.query, {
      limit: query.limit,
      documentTypes: [...query.documentTypes],
      ...(filterEntries !== undefined ? { filterEntries } : {})
    });
    return Object.values(grouped)
      .flatMap((entries) => entries ?? [])
      .map(toHit)
      .filter((hit): hit is DocumentSearchHit => hit !== null);
  }

  private index(): FoundryDocumentIndex | undefined {
    return this.globals().game.documentIndex;
  }
}
