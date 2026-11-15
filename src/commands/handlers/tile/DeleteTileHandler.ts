import type { DeleteTileParams, DeleteTileResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import { createFoundryTileService, deleteTileRequestSchema, toDeleteTileCommand } from '@/core/tiles';
import type { TileHandlerDependencies } from './GetTilesHandler';

export function createDeleteTileHandler(
  deps: TileHandlerDependencies = {}
): (params: DeleteTileParams) => Promise<DeleteTileResult> {
  const service = createFoundryTileService(deps.gameProvider);

  return async function deleteTileHandler(params: DeleteTileParams): Promise<DeleteTileResult> {
    const command = toDeleteTileCommand(parseRequest(deleteTileRequestSchema, params));
    const result = await service.deleteTile(command);
    return { deleted: true, tileId: result.tileId, sceneId: result.sceneId };
  };
}

export const deleteTileHandler = createDeleteTileHandler();
