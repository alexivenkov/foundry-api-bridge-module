import type { GetWallsParams, GetWallsResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  createFoundryWallService,
  getWallsRequestSchema,
  toListWallsQuery,
  type WallGameProvider
} from '@/core/walls';
import { toWireWall } from './wallWireMappers';

export interface WallHandlerDependencies {
  gameProvider?: WallGameProvider;
}

export function createGetWallsHandler(
  deps: WallHandlerDependencies = {}
): (params: GetWallsParams) => Promise<GetWallsResult> {
  const service = createFoundryWallService(deps.gameProvider);

  return function getWallsHandler(params: GetWallsParams): Promise<GetWallsResult> {
    try {
      const result = service.listWalls(toListWallsQuery(parseRequest(getWallsRequestSchema, params)));
      return Promise.resolve({ sceneId: result.sceneId, walls: result.walls.map(toWireWall) });
    } catch (error) {
      // Legacy contract of this command: it always rejects with an Error object.
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }
  };
}

export const getWallsHandler = createGetWallsHandler();
