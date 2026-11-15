/**
 * What a result yields: text, a world document, or an entry of a compendium
 * pack. The core stores the last two as one type since Foundry 13.
 */
export const TABLE_RESULT_KINDS = ['text', 'document', 'compendium'] as const;
export type TableResultKind = (typeof TABLE_RESULT_KINDS)[number];

/** The inclusive span of roll totals a result answers to. */
export type ResultRange = readonly [number, number];

export interface TableResult {
  readonly id: string;
  readonly kind: TableResultKind;
  readonly text: string;
  readonly img: string;
  readonly range: ResultRange;
  readonly weight: number;
  readonly drawn: boolean;
  readonly documentCollection: string | null;
  readonly documentId: string | null;
}

interface RollTableAttributes {
  readonly id: string;
  readonly name: string;
  readonly img: string;
  readonly description: string;
  readonly formula: string;
  /** Whether a drawn result goes back into the table. */
  readonly replacement: boolean;
}

export interface RollTable extends RollTableAttributes {
  readonly displayRoll: boolean;
  readonly results: readonly TableResult[];
  /** null at the root; absent when the core did not report a folder at all. */
  readonly folderId?: string | null | undefined;
}

/** A table without its rows: enough to list it, name it and count what has been drawn. */
export interface RollTableOverview extends RollTableAttributes {
  readonly totalResults: number;
  readonly drawnResults: number;
}

export interface TableResultDraft {
  readonly kind: TableResultKind;
  readonly text: string;
  readonly range: ResultRange;
  readonly weight: number;
  readonly img?: string | undefined;
  readonly documentCollection?: string | undefined;
  readonly documentId?: string | undefined;
}

export interface RollTableDraft {
  readonly name: string;
  readonly formula: string;
  readonly replacement: boolean;
  readonly displayRoll: boolean;
  readonly description?: string | undefined;
  readonly img?: string | undefined;
  readonly folderId?: string | undefined;
  /** Omitted: the table is created without rows. */
  readonly results?: readonly TableResultDraft[] | undefined;
}

/** The attributes a caller may change; an omitted one is left untouched. Rows are not among them. */
export interface RollTableChanges {
  readonly name?: string | undefined;
  readonly formula?: string | undefined;
  readonly replacement?: boolean | undefined;
  readonly displayRoll?: boolean | undefined;
  readonly description?: string | undefined;
  readonly img?: string | undefined;
  /** null moves the table to the root. */
  readonly folderId?: string | null | undefined;
}

export interface TableRoll {
  readonly formula: string;
  readonly total: number;
}

/** One draw: the roll that was made and the rows it landed on. */
export interface TableDraw {
  readonly formula: string;
  readonly total: number;
  readonly results: readonly TableResult[];
  /** The separate rolls of a multiple draw, in order; absent for a single draw, whose roll is `formula` / `total`. */
  readonly rolls?: readonly TableRoll[] | undefined;
}
