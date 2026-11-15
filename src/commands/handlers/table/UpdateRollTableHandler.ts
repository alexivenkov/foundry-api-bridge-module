import type { RollTableResult, UpdateRollTableParams } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  createFoundryRollTableManagementService,
  toUpdateRollTableCommand,
  updateRollTableRequestSchema
} from '@/core/tables';
import { toWireRollTable, type RollTableManagementHandlerDependencies } from './tableWireMappers';

export function createUpdateRollTableHandler(
  deps: RollTableManagementHandlerDependencies = {}
): (params: UpdateRollTableParams) => Promise<RollTableResult> {
  const service = createFoundryRollTableManagementService(deps.gameProvider, deps.rollGlobals);

  return async function updateRollTableHandler(params: UpdateRollTableParams): Promise<RollTableResult> {
    const command = toUpdateRollTableCommand(parseRequest(updateRollTableRequestSchema, params));
    return toWireRollTable(await service.updateTable(command));
  };
}

export const updateRollTableHandler = createUpdateRollTableHandler();
