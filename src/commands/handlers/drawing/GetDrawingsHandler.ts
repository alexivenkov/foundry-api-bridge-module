import type { GetDrawingsParams, GetDrawingsResult } from '@/commands/types';
import {
  createFoundryDrawingService,
  getDrawingsRequestSchema,
  toListDrawingsQuery,
  type DrawingGameProvider
} from '@/core/drawings';
import { parseRequest } from '@/core/shared';
import { toWireDrawing } from './drawingWireMappers';

export interface DrawingHandlerDependencies {
  gameProvider?: DrawingGameProvider;
}

export function createGetDrawingsHandler(
  deps: DrawingHandlerDependencies = {}
): (params: GetDrawingsParams) => Promise<GetDrawingsResult> {
  const service = createFoundryDrawingService(deps.gameProvider);

  return function getDrawingsHandler(params: GetDrawingsParams): Promise<GetDrawingsResult> {
    try {
      const result = service.listDrawings(toListDrawingsQuery(parseRequest(getDrawingsRequestSchema, params)));
      return Promise.resolve({ sceneId: result.sceneId, drawings: result.drawings.map(toWireDrawing) });
    } catch (error) {
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }
  };
}

export const getDrawingsHandler = createGetDrawingsHandler();
