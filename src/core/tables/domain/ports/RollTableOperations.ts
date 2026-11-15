import type { RollTable, TableDraw, TableResult, TableResultDraft } from '@/core/tables/domain/model/RollTable';
import type {
  TableDrawOptions,
  TableFolder,
  TableResultWrite,
  TableRollOptions
} from '@/core/tables/domain/model/TableOperations';

// The operations beyond the original table commands. Writes resolve to null
// when the table or row is gone, or when the core created nothing.

/** Rolls a table, drawing the rows it lands on or only looking at them. */
export interface RollTableRoller {
  draw(tableId: string, displayChat: boolean, options: TableDrawOptions): Promise<TableDraw | null>;
  /** Rolls without drawing: no chat card, no row marked as drawn. */
  preview(tableId: string, options: TableRollOptions): Promise<TableDraw | null>;
}

export interface RollTableEditor {
  /** Spreads the ranges by the rows' weights and sets the formula to match. */
  normalize(tableId: string): Promise<RollTable | null>;
  createFromFolder(folderId: string): Promise<RollTable | null>;
  createResult(tableId: string, draft: TableResultDraft): Promise<TableResult | null>;
  updateResult(tableId: string, resultId: string, write: TableResultWrite): Promise<TableResult | null>;
  deleteResult(tableId: string, resultId: string): Promise<void>;
}

export interface RollTableFolders {
  findFolder(folderId: string): TableFolder | null;
}

/** The core's own checks of a roll formula. */
export interface TableRollFormulas {
  isValid(formula: string): boolean;
  /** Dice whose count is itself an expression count as one. */
  countDice(formula: string): number;
}

export interface TableCompendiums {
  hasPack(packId: string): boolean;
}
