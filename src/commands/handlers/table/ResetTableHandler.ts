import type { ResetTableParams, ResetTableResult } from '@/commands/types';
import { getGame } from './tableTypes';

export async function resetTableHandler(params: ResetTableParams): Promise<ResetTableResult> {
  const table = getGame().tables.get(params.tableId);

  if (!table) {
    throw new Error(`Roll table not found: ${params.tableId}`);
  }

  const drawnCount = table.results.contents.filter(r => r.drawn).length;
  await table.resetResults();

  return {
    tableId: table.id,
    tableName: table.name,
    resetCount: drawnCount
  };
}
