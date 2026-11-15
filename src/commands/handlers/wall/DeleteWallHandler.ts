import type { DeleteWallParams, DeleteWallResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import { createFoundryWallService, deleteWallRequestSchema, toDeleteWallCommand } from '@/core/walls';
import type { WallHandlerDependencies } from './GetWallsHandler';

export function createDeleteWallHandler(
  deps: WallHandlerDependencies = {}
): (params: DeleteWallParams) => Promise<DeleteWallResult> {
  const service = createFoundryWallService(deps.gameProvider);

  return async function deleteWallHandler(params: DeleteWallParams): Promise<DeleteWallResult> {
    const command = toDeleteWallCommand(parseRequest(deleteWallRequestSchema, params));
    const result = await service.deleteWall(command);
    return { deleted: true, wallId: result.wallId, sceneId: result.sceneId };
  };
}

export const deleteWallHandler = createDeleteWallHandler();
