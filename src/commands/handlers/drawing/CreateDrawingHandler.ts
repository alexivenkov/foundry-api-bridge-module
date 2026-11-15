import type { CreateDrawingParams, CreateDrawingResult } from '@/commands/types';
import { createDrawingRequestSchema, createFoundryDrawingService, toCreateDrawingCommand } from '@/core/drawings';
import { parseRequest } from '@/core/shared';
import { toDrawingResult } from './drawingWireMappers';
import type { DrawingHandlerDependencies } from './GetDrawingsHandler';

export function createCreateDrawingHandler(
  deps: DrawingHandlerDependencies = {}
): (params: CreateDrawingParams) => Promise<CreateDrawingResult> {
  const service = createFoundryDrawingService(deps.gameProvider);

  return async function createDrawingHandler(params: CreateDrawingParams): Promise<CreateDrawingResult> {
    const command = toCreateDrawingCommand(parseRequest(createDrawingRequestSchema, params));
    return toDrawingResult(await service.createDrawing(command));
  };
}

export const createDrawingHandler = createCreateDrawingHandler();
