/** The document types the core document index holds (`metadata.indexed`); ActiveEffect only on Foundry 14. */
export const SEARCHABLE_DOCUMENT_TYPES = [
  'ActiveEffect',
  'Actor',
  'Card',
  'Cards',
  'Item',
  'JournalEntry',
  'JournalEntryPage',
  'Macro',
  'Playlist',
  'PlaylistSound',
  'RollTable',
  'Scene'
] as const;
export type SearchableDocumentType = (typeof SEARCHABLE_DOCUMENT_TYPES)[number];

export const SEARCH_SOURCES = ['all', 'world', 'compendiums'] as const;
export type SearchSource = (typeof SEARCH_SOURCES)[number];

export const SEARCH_LIMIT_DEFAULT = 10;
export const SEARCH_LIMIT_MAX = 100;
export const SEARCH_QUERY_MAX_LENGTH = 200;

export interface DocumentSearchQuery {
  readonly query: string;
  /** Empty = every indexed type. */
  readonly documentTypes: readonly SearchableDocumentType[];
  readonly source: SearchSource;
  /** Most matches per document type. */
  readonly limit: number;
}

export interface DocumentSearchHit {
  readonly uuid: string;
  readonly id: string;
  readonly name: string;
  readonly documentType: string;
  readonly subtype: string | null;
  readonly packId: string | null;
  readonly folderId: string | null;
  readonly parentUuid: string | null;
}

export interface DocumentSearchResult {
  readonly query: string;
  readonly results: readonly DocumentSearchHit[];
}
