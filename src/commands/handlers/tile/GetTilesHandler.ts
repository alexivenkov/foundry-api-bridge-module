import type { GetTilesParams, GetTilesResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  createFoundryTileService,
  getTilesRequestSchema,
  toListTilesQuery,
  type TileGameProvider
} from '@/core/tiles';
import { toWireTile } from './tileWireMappers';

export interface TileHandlerDependencies {
  gameProvider?: TileGameProvider;
}

export function createGetTilesHandler(
  deps: TileHandlerDependencies = {}
): (params: GetTilesParams) => Promise<GetTilesResult> {
  const service = createFoundryTileService(deps.gameProvider);

  return function getTilesHandler(params: GetTilesParams): Promise<GetTilesResult> {
    try {
      const result = service.listTiles(toListTilesQuery(parseRequest(getTilesRequestSchema, params)));
      return Promise.resolve({ sceneId: result.sceneId, tiles: result.tiles.map(toWireTile) });
    } catch (error) {
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }
  };
}

export const getTilesHandler = createGetTilesHandler();
