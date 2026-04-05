import type { ListRollTablesParams, RollTableSummary } from '@/commands/types';
import { getGame, mapTableToSummary } from './tableTypes';

export function listRollTablesHandler(_params: ListRollTablesParams): Promise<RollTableSummary[]> {
  const tables: RollTableSummary[] = [];

  getGame().tables.forEach(table => {
    tables.push(mapTableToSummary(table));
  });

  return Promise.resolve(tables);
}
