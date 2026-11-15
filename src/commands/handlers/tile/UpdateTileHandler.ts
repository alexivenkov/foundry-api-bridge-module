import type { UpdateTileParams, UpdateTileResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import { createFoundryTileService, toUpdateTileCommand, updateTileRequestSchema } from '@/core/tiles';
import type { TileHandlerDependencies } from './GetTilesHandler';
import { toTileResult } from './tileWireMappers';

export function createUpdateTileHandler(
  deps: TileHandlerDependencies = {}
): (params: UpdateTileParams) => Promise<UpdateTileResult> {
  const service = createFoundryTileService(deps.gameProvider);

  return async function updateTileHandler(params: UpdateTileParams): Promise<UpdateTileResult> {
    const command = toUpdateTileCommand(parseRequest(updateTileRequestSchema, params));
    return toTileResult(await service.updateTile(command));
  };
}

export const updateTileHandler = createUpdateTileHandler();
