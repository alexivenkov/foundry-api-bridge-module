import type { DeleteResult, DeleteRollTableParams } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  createFoundryRollTableService,
  deleteRollTableRequestSchema,
  toDeleteRollTableCommand
} from '@/core/tables';
import type { RollTableHandlerDependencies } from './tableWireMappers';

export function createDeleteRollTableHandler(
  deps: RollTableHandlerDependencies = {}
): (params: DeleteRollTableParams) => Promise<DeleteResult> {
  const service = createFoundryRollTableService(deps.gameProvider);

  return async function deleteRollTableHandler(params: DeleteRollTableParams): Promise<DeleteResult> {
    await service.deleteTable(toDeleteRollTableCommand(parseRequest(deleteRollTableRequestSchema, params)));
    return { deleted: true };
  };
}

export const deleteRollTableHandler = createDeleteRollTableHandler();
