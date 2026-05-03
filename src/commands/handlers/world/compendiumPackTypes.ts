import type { RawIndexEntry } from './compendiumMappers';

export interface PackMetadata {
  id?: string;
  label: string;
  type: string;
  system?: string | undefined;
  packageName?: string;
}

export interface PackIndexCollection {
  size: number;
  contents?: RawIndexEntry[];
  get(id: string): RawIndexEntry | undefined;
  forEach(fn: (entry: RawIndexEntry) => void): void;
}

export interface SearchFieldFilter {
  field: string;
  operator?: string;
  value?: unknown;
  negate?: boolean;
}

export interface SearchOptions {
  query?: string;
  filters?: SearchFieldFilter[];
  exclude?: string[];
}

export interface FoundryDocumentLike {
  id: string;
  uuid: string;
  name: string;
  type?: string;
  img?: string | null;
  toObject(source?: boolean): Record<string, unknown>;
}

export interface CompendiumPackFull {
  collection: string;
  metadata: PackMetadata;
  index: PackIndexCollection;
  getIndex(options?: { fields?: string[] }): Promise<PackIndexCollection>;
  search(options?: SearchOptions): Set<string> | RawIndexEntry[];
  getDocument(id: string): Promise<FoundryDocumentLike | null | undefined>;
}

export interface CompendiumPacksCollection {
  get(id: string): CompendiumPackFull | undefined;
}

export interface CompendiumGame {
  packs: CompendiumPacksCollection | undefined;
}

export function getCompendiumGame(): CompendiumGame {
  return (globalThis as unknown as { game: CompendiumGame }).game;
}
