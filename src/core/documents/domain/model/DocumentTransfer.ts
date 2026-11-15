import type { DocumentReference } from './DocumentReference';

/**
 * The only document types that may leave or enter the world as exported data. User (password hash), Setting
 * (credentials), ChatMessage and FogExploration are never among them.
 */
export const TRANSFERABLE_DOCUMENT_TYPES = [
  'Actor',
  'Cards',
  'Item',
  'JournalEntry',
  'Macro',
  'Playlist',
  'RollTable',
  'Scene'
] as const;
export type TransferableDocumentType = (typeof TRANSFERABLE_DOCUMENT_TYPES)[number];

/** What in imported data would run JavaScript: a script macro, or a scene region behavior that runs a script. */
export const SCRIPT_CONTENT_KINDS = [
  'script macro',
  'executeScript region behavior',
  'executeMacro region behavior aimed at a script macro'
] as const;
export type ScriptContentKind = (typeof SCRIPT_CONTENT_KINDS)[number];

export interface ExportedDocument {
  readonly document: DocumentReference;
  readonly data: Readonly<Record<string, unknown>>;
}

export interface ImportedDocument {
  readonly document: DocumentReference;
  readonly folderId: string | null;
}

export interface ImportFolder {
  readonly id: string;
  /** The document type the folder holds. */
  readonly type: string;
}
