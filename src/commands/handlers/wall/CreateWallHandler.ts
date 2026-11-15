import type { CreateWallParams, CreateWallResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import { createFoundryWallService, createWallRequestSchema, toCreateWallCommand } from '@/core/walls';
import type { WallHandlerDependencies } from './GetWallsHandler';
import { toWireWall } from './wallWireMappers';

export function createCreateWallHandler(
  deps: WallHandlerDependencies = {}
): (params: CreateWallParams) => Promise<CreateWallResult> {
  const service = createFoundryWallService(deps.gameProvider);

  return async function createWallHandler(params: CreateWallParams): Promise<CreateWallResult> {
    const command = toCreateWallCommand(parseRequest(createWallRequestSchema, params));
    return toWireWall(await service.createWall(command));
  };
}

export const createWallHandler = createCreateWallHandler();
