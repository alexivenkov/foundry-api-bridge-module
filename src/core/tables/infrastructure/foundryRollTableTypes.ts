/**
 * A TableResult in either of its two shapes.
 *
 * Since Foundry 13 (verified against 13.351 and 14.368) a result carries
 * `name`, `description` and `documentUuid`; `text`, `documentCollection` and
 * `documentId` are deprecated accessors on its prototype, to be removed in 15.
 * Before 13 those three are the stored fields and the new ones do not exist.
 * `type` is a number up to Foundry 11 and a string from 12 on.
 */
export interface FoundryTableResultDocument {
  _id: string;
  type: number | string;
  name: string | undefined;
  description?: string | undefined;
  documentUuid?: string | null | undefined;
  img: string | null | undefined;
  range: [number, number];
  weight: number;
  drawn: boolean;
  text: string | undefined;
  documentCollection: string | undefined;
  documentId: string | undefined;
}

export interface FoundryTableResultsCollection {
  contents: FoundryTableResultDocument[];
}

export interface FoundryTableRoll {
  total: number;
  formula: string;
  /** The pool `RollTable#drawMany` builds holds the separate rolls in its first term. */
  terms?: ReadonlyArray<{ rolls?: ReadonlyArray<{ formula: string; total: number }> }>;
}

export interface FoundryRollTableDraw {
  roll: FoundryTableRoll;
  results: FoundryTableResultDocument[];
}

export interface FoundryRollTableDocument {
  id: string;
  name: string;
  img: string | undefined;
  description: string | undefined;
  formula: string;
  replacement: boolean;
  displayRoll: boolean;
  results: FoundryTableResultsCollection;
  /** The Folder document or null; optional only because a bare stand-in may leave it out. */
  folder?: { id: string } | null | undefined;
  roll(): Promise<FoundryRollTableDraw>;
  draw(options?: { displayChat?: boolean }): Promise<FoundryRollTableDraw>;
  resetResults(): Promise<unknown>;
  update(data: Record<string, unknown>): Promise<unknown>;
  delete(): Promise<unknown>;
}

export interface FoundryRollTableClass {
  create(data: Record<string, unknown>): Promise<FoundryRollTableDocument | undefined>;
}

export interface FoundryRollTablesCollection {
  get(id: string): FoundryRollTableDocument | undefined;
  forEach(fn: (table: FoundryRollTableDocument) => void): void;
  documentClass: FoundryRollTableClass;
}

export interface FoundryRollTableGame {
  tables: FoundryRollTablesCollection;
}

/**
 * Options of `RollTable#draw` / `#drawMany` (13.351 and 14.368). The chat
 * visibility is `rollMode` up to 13 and `messageMode` from 14, where `rollMode`
 * is deprecated. `roll` must be a Roll instance.
 */
export interface FoundryTableDrawOptions {
  displayChat?: boolean;
  recursive?: boolean;
  roll?: unknown;
  rollMode?: string;
  messageMode?: string;
}

export interface FoundryTableResultsWithLookup extends FoundryTableResultsCollection {
  get(id: string): FoundryTableResultDocument | undefined;
}

/** The members the operations beyond the original commands use, identical in 13.351 and 14.368. */
export interface FoundryRollTableWorkshopDocument extends FoundryRollTableDocument {
  results: FoundryTableResultsWithLookup;
  roll(options?: { roll?: unknown; recursive?: boolean }): Promise<FoundryRollTableDraw>;
  draw(options?: FoundryTableDrawOptions): Promise<FoundryRollTableDraw>;
  drawMany(count: number, options?: FoundryTableDrawOptions): Promise<FoundryRollTableDraw>;
  /** Resolves to nothing when the ranges and formula already fit. */
  normalize(): Promise<unknown>;
  createEmbeddedDocuments(
    type: 'TableResult',
    data: Record<string, unknown>[]
  ): Promise<FoundryTableResultDocument[]>;
  updateEmbeddedDocuments(type: 'TableResult', updates: Record<string, unknown>[]): Promise<unknown>;
  deleteEmbeddedDocuments(type: 'TableResult', ids: string[]): Promise<unknown>;
}

export interface FoundryTableFolderDocument {
  id: string;
  name: string;
  type: string;
  contents: ReadonlyArray<unknown>;
}

export interface FoundryRollTableWorkshopClass extends FoundryRollTableClass {
  /** Opens the new table's sheet unless `renderSheet` is false. */
  fromFolder(
    folder: FoundryTableFolderDocument,
    options?: { renderSheet?: boolean }
  ): Promise<FoundryRollTableWorkshopDocument | undefined>;
}

export interface FoundryRollTableWorkshopCollection extends FoundryRollTablesCollection {
  get(id: string): FoundryRollTableWorkshopDocument | undefined;
  forEach(fn: (table: FoundryRollTableWorkshopDocument) => void): void;
  documentClass: FoundryRollTableWorkshopClass;
}

export interface FoundryRollTableWorkshopGame extends FoundryRollTableGame {
  tables: FoundryRollTableWorkshopCollection;
  folders: { get(id: string): FoundryTableFolderDocument | undefined };
  packs: { get(id: string): { documentName: string } | undefined };
}

/** The core's `Roll` as a table roll uses it. */
export interface FoundryTableRollClass {
  new (formula: string): { dice?: ReadonlyArray<{ number?: unknown }> };
  create(formula: string): unknown;
  /** Data references count as 1; the formula is parsed and evaluated without rolling a die. */
  validate(formula: string): boolean;
}

export type TableRollGlobalsProvider = () => { Roll: FoundryTableRollClass };
