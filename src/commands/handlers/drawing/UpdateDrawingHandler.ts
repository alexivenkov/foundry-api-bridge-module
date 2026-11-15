import type { UpdateDrawingParams, UpdateDrawingResult } from '@/commands/types';
import { createFoundryDrawingService, toUpdateDrawingCommand, updateDrawingRequestSchema } from '@/core/drawings';
import { parseRequest } from '@/core/shared';
import { toDrawingResult } from './drawingWireMappers';
import type { DrawingHandlerDependencies } from './GetDrawingsHandler';

export function createUpdateDrawingHandler(
  deps: DrawingHandlerDependencies = {}
): (params: UpdateDrawingParams) => Promise<UpdateDrawingResult> {
  const service = createFoundryDrawingService(deps.gameProvider);

  return async function updateDrawingHandler(params: UpdateDrawingParams): Promise<UpdateDrawingResult> {
    const command = toUpdateDrawingCommand(parseRequest(updateDrawingRequestSchema, params));
    return toDrawingResult(await service.updateDrawing(command));
  };
}

export const updateDrawingHandler = createUpdateDrawingHandler();
