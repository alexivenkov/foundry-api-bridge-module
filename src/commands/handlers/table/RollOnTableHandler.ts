import type { RollOnTableParams, RollOnTableResult } from '@/commands/types';
import { getGame, mapTableResultToData } from './tableTypes';

export async function rollOnTableHandler(params: RollOnTableParams): Promise<RollOnTableResult> {
  const table = getGame().tables.get(params.tableId);

  if (!table) {
    throw new Error(`Roll table not found: ${params.tableId}`);
  }

  const displayChat = params.displayChat ?? true;
  const { roll, results } = await table.draw({ displayChat });

  return {
    tableId: table.id,
    tableName: table.name,
    roll: {
      formula: roll.formula,
      total: roll.total
    },
    results: results.map(mapTableResultToData)
  };
}
