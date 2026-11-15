/**
 * The parts of a client Document the context touches (`common/abstract/document.mjs` and `ClientDocumentMixin`,
 * Foundry 13.351 / 14.368). Every document type shares them; whether a type has `ownership`, `flags` or `sort` is
 * read from its schema.
 */
export interface FoundryDocument {
  readonly id: string | null;
  readonly uuid: string;
  readonly documentName: string;
  readonly name?: string | null | undefined;
  /** The pack collection id of a compendium document, else null. */
  readonly pack?: string | null | undefined;
  readonly parent?: FoundryDocument | null | undefined;
  readonly schema: FoundryDataSchema;
  /** The stored data: plain JSON (ownership, flags, folder id, sort, type). */
  readonly _source: Readonly<Record<string, unknown>>;
  update(data: Record<string, unknown>, options?: Record<string, unknown>): Promise<unknown>;
  setFlag(scope: string, key: string, value: unknown): Promise<unknown>;
  unsetFlag(scope: string, key: string): Promise<unknown>;
  sortRelative(options: FoundrySortRelativeOptions): Promise<unknown>;
  /** `ToCompendiumOptions`: clearSort, clearFolder, clearFlags, clearSource, clearOwnership, clearState, keepId. */
  toCompendium(pack: null, options?: Record<string, boolean>): Record<string, unknown>;
  getEmbeddedCollection?(embeddedName: string): FoundryDocumentCollection;
}

export interface FoundryDataSchema {
  has(fieldName: string): boolean;
}

/** `foundry.utils.performIntegerSort` options, as `ClientDocumentMixin#sortRelative` passes them on. */
export interface FoundrySortRelativeOptions {
  target: FoundryDocument;
  siblings: FoundryDocument[];
  sortKey: 'sort';
  sortBefore: boolean;
}

export interface FoundryDocumentCollection {
  readonly contents: readonly FoundryDocument[];
}

export interface FoundryWorldCollection extends FoundryDocumentCollection {
  /** `WorldCollection#fromCompendium`: the data of a source document made ready for creation in the world. */
  fromCompendium(document: FoundryDocument, options: Record<string, boolean>): Record<string, unknown>;
}

export interface FoundryDocumentClass {
  /** `ClientDocumentMixin.fromImport` (12+): migrates older data through the server, refuses newer, validates strictly. */
  fromImport?(source: Record<string, unknown>): Promise<FoundryDocument>;
  fromSource(source: Record<string, unknown>, options: { strict: boolean }): FoundryDocument;
  create(data: Record<string, unknown>): Promise<FoundryDocument | null | undefined>;
}

/** One match of `DocumentIndex#lookup` (`WordTreeEntry`). */
export interface FoundryWordTreeEntry {
  /** The live document for a world entry; the compendium index entry (plain data) for a pack entry. */
  readonly entry: FoundryIndexedRecord;
  readonly documentName: string;
  /** Foundry 13 writes the legacy `Compendium.<pack>.<id>` form for pack entries. */
  readonly uuid: string;
  readonly pack?: string | undefined;
}

export interface FoundryIndexedRecord {
  readonly _id?: string | null | undefined;
  readonly id?: string | null | undefined;
  readonly name?: string | null | undefined;
  readonly type?: unknown;
  /** A folder id on a pack index entry; a Folder document on a world document. */
  readonly folder?: unknown;
  readonly _source?: Readonly<Record<string, unknown>> | undefined;
  readonly parent?: { readonly uuid: string } | null | undefined;
}

export interface FoundryDocumentIndexLookupOptions {
  limit: number;
  documentTypes: string[];
  filterEntries?: (entry: FoundryWordTreeEntry) => boolean;
}

export interface FoundryDocumentIndex {
  /** Pending while `Game#setupGame` builds the index; null before it started. */
  readonly ready?: Promise<void> | null | undefined;
  lookup(query: string, options: FoundryDocumentIndexLookupOptions): Record<string, FoundryWordTreeEntry[] | undefined>;
}

export interface FoundryUserLike {
  readonly name: string;
}

export interface FoundryDocumentGame {
  readonly version: string;
  readonly system: { readonly id: string; readonly version: string };
  readonly world: { readonly id: string };
  readonly users: { get(id: string): FoundryUserLike | undefined };
  readonly folders: FoundryDocumentCollection & { get(id: string): FoundryDocument | undefined };
  readonly collections: { get(documentName: string): FoundryWorldCollection | undefined };
  readonly documentIndex?: FoundryDocumentIndex | undefined;
}

export interface FoundryDatabaseBackend {
  /** core, world, the system id and the active modules (`ClientDatabaseBackend#getFlagScopes`). */
  getFlagScopes(): string[];
}

export interface FoundryDocumentGlobals {
  game: FoundryDocumentGame;
  /** `CONFIG[documentName].documentClass` and `CONFIG.DatabaseBackend`. */
  CONFIG: Readonly<Record<string, unknown>>;
  foundry?: { utils?: { fromUuid?: (uuid: string) => Promise<unknown> } } | undefined;
  /** The global alias the client also installs (Foundry 11 / 12 have only this one). */
  fromUuid?: ((uuid: string) => Promise<unknown>) | undefined;
}

export type DocumentGlobalsProvider = () => FoundryDocumentGlobals;

export const documentGlobalsFromGlobalThis: DocumentGlobalsProvider = () =>
  globalThis as unknown as FoundryDocumentGlobals;

export function documentClassOf(globals: FoundryDocumentGlobals, documentName: string): FoundryDocumentClass | null {
  const config = globals.CONFIG[documentName] as { documentClass?: FoundryDocumentClass } | null | undefined;
  return config?.documentClass ?? null;
}

export function databaseBackendOf(globals: FoundryDocumentGlobals): FoundryDatabaseBackend | null {
  return (globals.CONFIG['DatabaseBackend'] as FoundryDatabaseBackend | undefined) ?? null;
}
