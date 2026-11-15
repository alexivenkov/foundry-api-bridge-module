import type { CreateTileParams, CreateTileResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import { createFoundryTileService, createTileRequestSchema, toCreateTileCommand } from '@/core/tiles';
import type { TileHandlerDependencies } from './GetTilesHandler';
import { toTileResult } from './tileWireMappers';

export function createCreateTileHandler(
  deps: TileHandlerDependencies = {}
): (params: CreateTileParams) => Promise<CreateTileResult> {
  const service = createFoundryTileService(deps.gameProvider);

  return async function createTileHandler(params: CreateTileParams): Promise<CreateTileResult> {
    const command = toCreateTileCommand(parseRequest(createTileRequestSchema, params));
    return toTileResult(await service.createTile(command));
  };
}

export const createTileHandler = createCreateTileHandler();
