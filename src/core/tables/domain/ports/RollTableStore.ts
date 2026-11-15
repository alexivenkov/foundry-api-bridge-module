import type {
  RollTable,
  RollTableChanges,
  RollTableDraft,
  RollTableOverview,
  TableDraw
} from '@/core/tables/domain/model/RollTable';

// Reads are synchronous: the world's roll tables live in memory. `createTable`
// resolves to null when the core created nothing; `updateTable` and `draw`
// when the table is gone.
export interface RollTableStore {
  listTables(): readonly RollTableOverview[];
  findOverview(tableId: string): RollTableOverview | null;
  findTable(tableId: string): RollTable | null;
  createTable(draft: RollTableDraft): Promise<RollTable | null>;
  updateTable(tableId: string, changes: RollTableChanges): Promise<RollTable | null>;
  deleteTable(tableId: string): Promise<void>;
  /** Rolls the table's formula and marks the rows it lands on as drawn. */
  draw(tableId: string, displayChat: boolean): Promise<TableDraw | null>;
  resetResults(tableId: string): Promise<void>;
}
