import type { ListRollTablesParams, RollTableSummary } from '@/commands/types';
import { asError } from '@/commands/handlers/legacyWire';
import { createFoundryRollTableService } from '@/core/tables';
import { toWireRollTableSummary, type RollTableHandlerDependencies } from './tableWireMappers';

export function createListRollTablesHandler(
  deps: RollTableHandlerDependencies = {}
): (params: ListRollTablesParams) => Promise<RollTableSummary[]> {
  const service = createFoundryRollTableService(deps.gameProvider);

  // The command takes no parameters, so there is nothing to validate.
  return function listRollTablesHandler(_params: ListRollTablesParams): Promise<RollTableSummary[]> {
    try {
      return Promise.resolve(service.listTables().map(toWireRollTableSummary));
    } catch (error) {
      return Promise.reject(asError(error));
    }
  };
}

export const listRollTablesHandler = createListRollTablesHandler();
