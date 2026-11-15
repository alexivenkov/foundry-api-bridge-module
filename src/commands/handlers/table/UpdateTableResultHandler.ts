import type { TableResultEntryResult, UpdateTableResultParams } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  createFoundryRollTableManagementService,
  toUpdateTableResultCommand,
  updateTableResultRequestSchema
} from '@/core/tables';
import { toWireTableResult, type RollTableManagementHandlerDependencies } from './tableWireMappers';

export function createUpdateTableResultHandler(
  deps: RollTableManagementHandlerDependencies = {}
): (params: UpdateTableResultParams) => Promise<TableResultEntryResult> {
  const service = createFoundryRollTableManagementService(deps.gameProvider, deps.rollGlobals);

  return async function updateTableResultHandler(params: UpdateTableResultParams): Promise<TableResultEntryResult> {
    const command = toUpdateTableResultCommand(parseRequest(updateTableResultRequestSchema, params));
    const result = await service.updateResult(command);
    return { tableId: command.tableId, result: toWireTableResult(result) };
  };
}

export const updateTableResultHandler = createUpdateTableResultHandler();
