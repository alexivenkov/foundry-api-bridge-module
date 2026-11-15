import type { FlaggedDocument } from '@/core/documents/domain/model/DocumentFlags';
import type { OwnedDocument, OwnershipLevels } from '@/core/documents/domain/model/DocumentOwnership';
import type { DocumentReference } from '@/core/documents/domain/model/DocumentReference';
import type { DocumentSearchHit, DocumentSearchQuery } from '@/core/documents/domain/model/DocumentSearch';
import type {
  ImportFolder,
  ImportedDocument,
  ScriptContentKind,
  TransferableDocumentType
} from '@/core/documents/domain/model/DocumentTransfer';
import type { SortPosition, SortableDocument } from '@/core/documents/domain/model/SortableDocument';

// Lookups are asynchronous because a uuid may point into a compendium pack. A write resolves to null when the
// document disappeared in between.

export interface DocumentOwnershipStore {
  findDocument(uuid: string): Promise<OwnedDocument | null>;
  /** Null when the world has no such user. */
  userName(userId: string): string | null;
  /** Replaces the stored ownership as a whole, the way the core ownership dialog does. */
  replaceOwnership(uuid: string, ownership: OwnershipLevels): Promise<OwnedDocument | null>;
}

export interface DocumentFlagStore {
  findDocument(uuid: string): Promise<FlaggedDocument | null>;
  activeScopes(): readonly string[];
  setFlag(uuid: string, scope: string, key: string, value: unknown): Promise<FlaggedDocument | null>;
  unsetFlag(uuid: string, scope: string, key: string): Promise<FlaggedDocument | null>;
}

export interface DocumentSortStore {
  findDocument(uuid: string): Promise<SortableDocument | null>;
  sortRelative(uuid: string, targetUuid: string, position: SortPosition): Promise<SortableDocument | null>;
}

export interface DocumentIndexReader {
  isAvailable(): boolean;
  search(query: DocumentSearchQuery): Promise<readonly DocumentSearchHit[]>;
}

export interface DocumentExporter {
  findDocument(uuid: string): Promise<DocumentReference | null>;
  /** The "Export Data" form of the document as plain JSON. */
  exportDocument(uuid: string): Promise<Readonly<Record<string, unknown>> | null>;
}

export interface DocumentImporter {
  findFolder(folderId: string): ImportFolder | null;
  findScriptContent(
    documentType: TransferableDocumentType,
    data: Readonly<Record<string, unknown>>
  ): Promise<readonly ScriptContentKind[]>;
  /** Resolves to null when the core created nothing (a hook vetoed it). */
  importDocument(
    documentType: TransferableDocumentType,
    data: Readonly<Record<string, unknown>>,
    folderId: string | null
  ): Promise<ImportedDocument | null>;
}

/** The world's consent to scripts arriving through the API (the macros context's "Allow Script Macros"). */
export interface ScriptContentPolicy {
  allowsScripts(): boolean;
}
