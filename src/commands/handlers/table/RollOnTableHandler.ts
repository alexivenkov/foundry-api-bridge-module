import type { RollOnTableParams, RollOnTableResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import { createFoundryRollTableManagementService, rollOnTableRequestSchema, toRollOnTableCommand } from '@/core/tables';
import {
  toWireTableResult,
  toWireTableRolls,
  type RollTableManagementHandlerDependencies
} from './tableWireMappers';

export function createRollOnTableHandler(
  deps: RollTableManagementHandlerDependencies = {}
): (params: RollOnTableParams) => Promise<RollOnTableResult> {
  const service = createFoundryRollTableManagementService(deps.gameProvider, deps.rollGlobals);

  return async function rollOnTableHandler(params: RollOnTableParams): Promise<RollOnTableResult> {
    const command = toRollOnTableCommand(parseRequest(rollOnTableRequestSchema, params));
    const { table, draw } = await service.rollOnTable(command);
    return {
      tableId: table.id,
      tableName: table.name,
      roll: { formula: draw.formula, total: draw.total },
      results: draw.results.map(toWireTableResult),
      rolls: toWireTableRolls(draw)
    };
  };
}

export const rollOnTableHandler = createRollOnTableHandler();
