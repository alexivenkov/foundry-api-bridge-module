import type { FoundryAdventureClass } from './foundryAdventureTypes';

// Structural types for the Foundry API the compendium management gateways use
// (CompendiumCollection management, world folders and collections). Verified
// against the v13.351 and v14.368 clients.

export interface FoundryPackFolder {
  id: string;
  name: string;
  _source: { folder?: string | null };
  toObject(): Record<string, unknown>;
}

export interface FoundryPackFolderCollection {
  contents: FoundryPackFolder[];
  get(id: string): FoundryPackFolder | undefined;
}

export interface FoundryManagedPackIndexEntry {
  _id: string;
  folder?: string | null;
  name?: string | null;
  /** Only when the index was requested with `fields: ['type']` (a Macro's index lacks it otherwise). */
  type?: string | null;
}

export interface FoundryManagedPackIndex {
  size: number;
  keys(): Iterable<string>;
  forEach(fn: (entry: FoundryManagedPackIndexEntry) => void): void;
}

export interface FoundryManagedPackMetadata {
  label: string;
  type: string;
  system?: string | undefined;
  packageType?: string | undefined;
  packageName?: string | undefined;
}

export interface FoundryPackDocumentLike {
  id: string;
  uuid: string;
  name: string;
  type?: string | null | undefined;
  img?: string | null | undefined;
  _source: { folder?: string | null };
  /** The stored data (`Document#toObject`). */
  toObject?(): Record<string, unknown>;
  update(changes: Record<string, unknown>): Promise<unknown>;
  delete(): Promise<unknown>;
}

export interface FoundryCreatedWorldDocument {
  id: string;
  name: string;
}

export interface FoundryWorldDocument {
  id: string;
  name: string;
  clone(data: Record<string, unknown>, context: { keepId: boolean }): FoundryWorldDocument;
}

export interface FoundryWorldFolder {
  id: string;
  name: string;
  type: string;
  _source: { folder?: string | null };
  contents: readonly unknown[];
  getSubfolders(recursive: boolean): FoundryWorldFolder[];
  exportToCompendium(pack: FoundryManagedPack, options: Record<string, unknown>): Promise<unknown>;
}

export interface FoundryManagedPack {
  collection: string;
  title: string;
  metadata: FoundryManagedPackMetadata;
  index: FoundryManagedPackIndex;
  /** `config.locked`, else locked unless it is a world pack. */
  locked: boolean;
  /** Role name → level name (`PLAYER: 'OBSERVER'`); a role may be missing. */
  ownership: Record<string, string | undefined>;
  /** The sidebar folder of the pack. */
  folder: { id: string; color?: string | null } | null;
  folders: FoundryPackFolderCollection;
  configure(configuration: Record<string, unknown>): Promise<void>;
  deleteCompendium(): Promise<unknown>;
  duplicateCompendium(options: { label: string }): Promise<unknown>;
  importDocument(
    document: FoundryWorldDocument,
    options: Record<string, unknown>
  ): Promise<FoundryPackDocumentLike | null | undefined>;
  importAll(options: Record<string, unknown>): Promise<FoundryCreatedWorldDocument[]>;
  getIndex(options?: { fields?: string[] }): Promise<FoundryManagedPackIndex>;
  getDocument(id: string): Promise<FoundryPackDocumentLike | null | undefined>;
  getDocuments(query?: Record<string, unknown>): Promise<FoundryPackDocumentLike[]>;
}

export interface FoundryWorldCollection {
  get(id: string): FoundryWorldDocument | undefined;
  has(id: string): boolean;
  documentClass: {
    createDocuments(
      data: Record<string, unknown>[],
      options: Record<string, unknown>
    ): Promise<FoundryCreatedWorldDocument[]>;
  };
  fromCompendium(document: FoundryPackDocumentLike, options: Record<string, unknown>): Record<string, unknown>;
}

export interface FoundryManagementGame {
  packs: {
    get(id: string): FoundryManagedPack | undefined;
  };
  folders: {
    get(id: string): FoundryWorldFolder | undefined;
    has(id: string): boolean;
    contents: FoundryWorldFolder[];
  };
  collections: {
    get(documentName: string): FoundryWorldCollection | undefined;
  };
  settings: {
    get(namespace: string, key: string): unknown;
  };
}

export interface FoundryCompendiumCollectionClass {
  createCompendium(metadata: { label: string; type: string }): Promise<unknown>;
}

export interface FoundryFolderClass {
  createDocuments(
    data: Record<string, unknown>[],
    options: { keepId: boolean }
  ): Promise<FoundryCreatedWorldDocument[]>;
}

export interface PackManagementGlobals {
  compendiumCollectionClass(): FoundryCompendiumCollectionClass | undefined;
  /** `CONST.COMPENDIUM_DOCUMENT_TYPES`. */
  compendiumDocumentTypes(): readonly string[];
  /** `String#slugify({strict: true})`, the slug the server derives a new pack name from. */
  slugify(label: string): string;
  adventureClass(): FoundryAdventureClass | undefined;
  folderClass(): FoundryFolderClass | undefined;
}

export interface PackManagementGameProvider {
  getGame(): FoundryManagementGame;
}
