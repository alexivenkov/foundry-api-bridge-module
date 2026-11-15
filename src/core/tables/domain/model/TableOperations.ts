import type { ResultRange, TableResultKind } from './RollTable';

/** Who sees the chat card of a draw: everyone, the GMs, the GMs without its author, only its author. */
export const TABLE_DRAW_VISIBILITIES = ['public', 'gm', 'blind', 'self'] as const;
export type TableDrawVisibility = (typeof TABLE_DRAW_VISIBILITIES)[number];

/** How the table is rolled. Without a formula the table's own is used. */
export interface TableRollOptions {
  readonly formula?: string | undefined;
  /** Whether a row that points to another table rolls that table instead. */
  readonly recursive: boolean;
}

export interface TableDrawOptions extends TableRollOptions {
  /** One draw, or several in a single call. */
  readonly count: number;
  /** The GM's own roll mode when omitted. */
  readonly visibility?: TableDrawVisibility | undefined;
}

/**
 * The document types a row may point to in the world, and whose folders a
 * table can be built from: the core's compendium document types that have a
 * world collection.
 */
export const TABLE_LINKABLE_DOCUMENT_TYPES = [
  'Actor',
  'Cards',
  'Item',
  'JournalEntry',
  'Macro',
  'Playlist',
  'RollTable',
  'Scene'
] as const;

export interface TableFolder {
  readonly id: string;
  readonly name: string;
  /** The document type the folder holds (`Actor`, `RollTable`, `Compendium`, …). */
  readonly type: string;
  /** How many documents sit directly in it. */
  readonly documentCount: number;
}

/** Where a row leads: a document type and id in the world, or a pack id and an entry id. */
export interface TableResultReference {
  readonly collection: string;
  readonly id: string;
}

/** The fields an update writes, already resolved against the row as it was. */
export interface TableResultWrite {
  /** The row's kind after the update. */
  readonly kind: TableResultKind;
  readonly kindChanged: boolean;
  /** Present when the label changes, or has to move along with a new kind. */
  readonly text?: string | undefined;
  readonly range?: ResultRange | undefined;
  readonly weight?: number | undefined;
  readonly drawn?: boolean | undefined;
  /** null clears it. */
  readonly img?: string | null | undefined;
  /** null drops the reference. */
  readonly reference?: TableResultReference | null | undefined;
}

/** A partial change of a row as the caller asked for it. */
export interface TableResultChanges {
  readonly kind?: TableResultKind | undefined;
  readonly text?: string | undefined;
  readonly range?: ResultRange | undefined;
  readonly weight?: number | undefined;
  readonly drawn?: boolean | undefined;
  readonly img?: string | null | undefined;
  readonly reference?: TableResultReference | null | undefined;
}
