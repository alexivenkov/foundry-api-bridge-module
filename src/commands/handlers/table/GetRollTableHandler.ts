import type { GetRollTableParams, RollTableResult } from '@/commands/types';
import { getGame, mapTableToResult } from './tableTypes';

export function getRollTableHandler(params: GetRollTableParams): Promise<RollTableResult> {
  const table = getGame().tables.get(params.tableId);

  if (!table) {
    return Promise.reject(new Error(`Roll table not found: ${params.tableId}`));
  }

  return Promise.resolve(mapTableToResult(table));
}
