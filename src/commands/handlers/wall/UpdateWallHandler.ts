import type { UpdateWallParams, UpdateWallResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import { createFoundryWallService, toUpdateWallCommand, updateWallRequestSchema } from '@/core/walls';
import type { WallHandlerDependencies } from './GetWallsHandler';
import { toWireWall } from './wallWireMappers';

export function createUpdateWallHandler(
  deps: WallHandlerDependencies = {}
): (params: UpdateWallParams) => Promise<UpdateWallResult> {
  const service = createFoundryWallService(deps.gameProvider);

  return async function updateWallHandler(params: UpdateWallParams): Promise<UpdateWallResult> {
    const command = toUpdateWallCommand(parseRequest(updateWallRequestSchema, params));
    return toWireWall(await service.updateWall(command));
  };
}

export const updateWallHandler = createUpdateWallHandler();
