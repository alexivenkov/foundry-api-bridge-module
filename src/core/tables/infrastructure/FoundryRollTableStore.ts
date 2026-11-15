import type { GameProvider } from '@/core/shared';
import type {
  RollTable,
  RollTableChanges,
  RollTableDraft,
  RollTableOverview,
  RollTableStore,
  TableDraw
} from '@/core/tables/domain';
import type { FoundryRollTableGame, FoundryRollTablesCollection } from './foundryRollTableTypes';
import {
  toFoundryRollTableChanges,
  toFoundryRollTableData,
  toRollTable,
  toRollTableOverview,
  toTableDraw
} from './rollTableMapper';

export type RollTableGameProvider = GameProvider<FoundryRollTableGame>;

/** Anti-corruption layer over the world's RollTable documents. */
export class FoundryRollTableStore implements RollTableStore {
  constructor(private readonly gameProvider: RollTableGameProvider) {}

  listTables(): readonly RollTableOverview[] {
    const overviews: RollTableOverview[] = [];
    this.tables().forEach((document) => {
      overviews.push(toRollTableOverview(document));
    });
    return overviews;
  }

  findOverview(tableId: string): RollTableOverview | null {
    const document = this.tables().get(tableId);
    return document !== undefined ? toRollTableOverview(document) : null;
  }

  findTable(tableId: string): RollTable | null {
    const document = this.tables().get(tableId);
    return document !== undefined ? toRollTable(document) : null;
  }

  async createTable(draft: RollTableDraft): Promise<RollTable | null> {
    const document = await this.tables().documentClass.create(toFoundryRollTableData(draft));
    return document ? toRollTable(document) : null;
  }

  async updateTable(tableId: string, changes: RollTableChanges): Promise<RollTable | null> {
    const document = this.tables().get(tableId);
    if (document === undefined) {
      return null;
    }
    await document.update(toFoundryRollTableChanges(changes));
    return toRollTable(document);
  }

  async deleteTable(tableId: string): Promise<void> {
    await this.tables().get(tableId)?.delete();
  }

  async draw(tableId: string, displayChat: boolean): Promise<TableDraw | null> {
    const document = this.tables().get(tableId);
    if (document === undefined) {
      return null;
    }
    return toTableDraw(await document.draw({ displayChat }));
  }

  async resetResults(tableId: string): Promise<void> {
    await this.tables().get(tableId)?.resetResults();
  }

  private tables(): FoundryRollTablesCollection {
    return this.gameProvider.getGame().tables;
  }
}
