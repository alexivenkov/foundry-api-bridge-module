import type { DeleteTableResultParams, DeleteTableResultResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  createFoundryRollTableManagementService,
  deleteTableResultRequestSchema,
  toDeleteTableResultCommand
} from '@/core/tables';
import type { RollTableManagementHandlerDependencies } from './tableWireMappers';

export function createDeleteTableResultHandler(
  deps: RollTableManagementHandlerDependencies = {}
): (params: DeleteTableResultParams) => Promise<DeleteTableResultResult> {
  const service = createFoundryRollTableManagementService(deps.gameProvider, deps.rollGlobals);

  return async function deleteTableResultHandler(params: DeleteTableResultParams): Promise<DeleteTableResultResult> {
    const command = toDeleteTableResultCommand(parseRequest(deleteTableResultRequestSchema, params));
    await service.deleteResult(command);
    return { deleted: true, tableId: command.tableId, resultId: command.resultId };
  };
}

export const deleteTableResultHandler = createDeleteTableResultHandler();
