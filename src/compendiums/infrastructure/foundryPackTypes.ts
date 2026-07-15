// Consolidated structural types for the Foundry compendium API surface this
// context touches. Each gateway only calls the members its flow historically
// used, so partial runtime shapes (e.g. contract-test mocks) stay compatible.

export interface FoundryPackMetadata {
  label: string;
  type: string;
  system?: string | undefined;
  packageName?: string;
}

export interface RawIndexEntry {
  _id?: string;
  id?: string;
  name?: string;
  img?: string | null;
  type?: string | null;
  [path: string]: unknown;
}

export interface FoundryPackIndex {
  size: number;
  contents?: RawIndexEntry[];
  get(id: string): RawIndexEntry | undefined;
  forEach(fn: (entry: RawIndexEntry) => void): void;
}

export interface FoundrySearchFieldFilter {
  field: string;
  operator: string;
  value?: unknown;
  negate: boolean;
}

export interface FoundrySearchOptions {
  query?: string;
  filters?: FoundrySearchFieldFilter[];
  exclude?: string[];
}

export interface FoundryPackDocument {
  id: string;
  uuid: string;
  name: string;
  type?: string;
  img?: string | null;
  toObject(source?: boolean): Record<string, unknown>;
}

export interface FoundryPack {
  collection: string;
  metadata: FoundryPackMetadata;
  index: FoundryPackIndex;
  getIndex(options?: { fields?: string[] }): Promise<FoundryPackIndex>;
  search(options?: FoundrySearchOptions): Set<string> | RawIndexEntry[];
  getDocument(id: string): Promise<FoundryPackDocument | null | undefined>;
  getDocuments(query?: Record<string, unknown>): Promise<FoundryPackDocument[]>;
}

export interface FoundryPacksCollection {
  get(id: string): FoundryPack | undefined;
  forEach(fn: (pack: FoundryPack) => void): void;
}

export interface FoundryEmbeddedItem {
  id: string;
  name: string;
  type: string;
  img: string;
}

export interface FoundryWorldActor {
  id: string;
  name: string;
  createEmbeddedDocuments(
    embeddedName: string,
    data: Record<string, unknown>[]
  ): Promise<FoundryEmbeddedItem[]>;
}

export interface FoundryCreatedDocument {
  id: string;
  uuid: string;
  name: string;
  type: string;
  img: string;
  folder: { name: string } | null;
}

export interface FoundryWorldDocumentClass {
  create(data: Record<string, unknown>): Promise<FoundryCreatedDocument>;
}

export interface FoundryWorldActorsCollection {
  get(id: string): FoundryWorldActor | undefined;
  documentClass: FoundryWorldDocumentClass;
}

export interface FoundryWorldItemsCollection {
  documentClass: FoundryWorldDocumentClass;
}

export interface CompendiumGameGlobals {
  packs: FoundryPacksCollection | undefined;
  actors: FoundryWorldActorsCollection;
  items: FoundryWorldItemsCollection;
}
