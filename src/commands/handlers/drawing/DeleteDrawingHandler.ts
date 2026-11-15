import type { DeleteDrawingParams, DeleteDrawingResult } from '@/commands/types';
import { createFoundryDrawingService, deleteDrawingRequestSchema, toDeleteDrawingCommand } from '@/core/drawings';
import { parseRequest } from '@/core/shared';
import type { DrawingHandlerDependencies } from './GetDrawingsHandler';

export function createDeleteDrawingHandler(
  deps: DrawingHandlerDependencies = {}
): (params: DeleteDrawingParams) => Promise<DeleteDrawingResult> {
  const service = createFoundryDrawingService(deps.gameProvider);

  return async function deleteDrawingHandler(params: DeleteDrawingParams): Promise<DeleteDrawingResult> {
    const command = toDeleteDrawingCommand(parseRequest(deleteDrawingRequestSchema, params));
    const result = await service.deleteDrawing(command);
    return { deleted: true, drawingId: result.drawingId, sceneId: result.sceneId };
  };
}

export const deleteDrawingHandler = createDeleteDrawingHandler();
