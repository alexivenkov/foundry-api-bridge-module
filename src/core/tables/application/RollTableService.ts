import {
  RollTableCreationCancelledError,
  RollTableNotFoundError,
  type RollTable,
  type RollTableOverview,
  type RollTableStore,
  type TableDraw
} from '@/core/tables/domain';
import type {
  CreateRollTableCommand,
  DeleteRollTableCommand,
  GetRollTableQuery,
  ResetTableCommand,
  RollOnTableCommand,
  UpdateRollTableCommand
} from './commands';

export interface RollTableServiceDependencies {
  readonly tables: RollTableStore;
}

export interface TableDrawResult {
  readonly table: RollTableOverview;
  readonly draw: TableDraw;
}

export interface TableResetResult {
  readonly table: RollTableOverview;
  /** How many results were marked as drawn before the reset. */
  readonly resetCount: number;
}

export class RollTableService {
  constructor(private readonly deps: RollTableServiceDependencies) {}

  listTables(): readonly RollTableOverview[] {
    return this.deps.tables.listTables();
  }

  getTable(query: GetRollTableQuery): RollTable {
    const table = this.deps.tables.findTable(query.tableId);
    if (table === null) {
      throw new RollTableNotFoundError(query.tableId);
    }
    return table;
  }

  async rollOnTable(command: RollOnTableCommand): Promise<TableDrawResult> {
    const table = this.requireTable(command.tableId);
    const draw = await this.deps.tables.draw(command.tableId, command.displayChat);
    if (draw === null) {
      throw new RollTableNotFoundError(command.tableId);
    }
    return { table, draw };
  }

  async resetTable(command: ResetTableCommand): Promise<TableResetResult> {
    const table = this.requireTable(command.tableId);
    await this.deps.tables.resetResults(command.tableId);
    return { table, resetCount: table.drawnResults };
  }

  async createTable(command: CreateRollTableCommand): Promise<RollTable> {
    const table = await this.deps.tables.createTable(command.draft);
    if (table === null) {
      throw new RollTableCreationCancelledError();
    }
    return table;
  }

  async updateTable(command: UpdateRollTableCommand): Promise<RollTable> {
    this.requireTable(command.tableId);
    const updated = await this.deps.tables.updateTable(command.tableId, command.changes);
    if (updated === null) {
      throw new RollTableNotFoundError(command.tableId);
    }
    return updated;
  }

  async deleteTable(command: DeleteRollTableCommand): Promise<void> {
    this.requireTable(command.tableId);
    await this.deps.tables.deleteTable(command.tableId);
  }

  private requireTable(tableId: string): RollTableOverview {
    const table = this.deps.tables.findOverview(tableId);
    if (table === null) {
      throw new RollTableNotFoundError(tableId);
    }
    return table;
  }
}
