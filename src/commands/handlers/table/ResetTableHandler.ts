import type { ResetTableParams, ResetTableResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import { createFoundryRollTableService, resetTableRequestSchema, toResetTableCommand } from '@/core/tables';
import type { RollTableHandlerDependencies } from './tableWireMappers';

export function createResetTableHandler(
  deps: RollTableHandlerDependencies = {}
): (params: ResetTableParams) => Promise<ResetTableResult> {
  const service = createFoundryRollTableService(deps.gameProvider);

  return async function resetTableHandler(params: ResetTableParams): Promise<ResetTableResult> {
    const command = toResetTableCommand(parseRequest(resetTableRequestSchema, params));
    const { table, resetCount } = await service.resetTable(command);
    return { tableId: table.id, tableName: table.name, resetCount };
  };
}

export const resetTableHandler = createResetTableHandler();
