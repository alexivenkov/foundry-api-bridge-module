import type { GetCanvasViewParams, GetCanvasViewResult } from '@/commands/types';
import { createFoundryCanvasStageService, type CanvasStageWiring } from '@/core/ui';
import { toWireCanvasView } from './canvasWireMappers';

export type CanvasStageHandlerDependencies = CanvasStageWiring;

export function createGetCanvasViewHandler(
  deps: CanvasStageHandlerDependencies = {}
): (params: GetCanvasViewParams) => Promise<GetCanvasViewResult> {
  const service = createFoundryCanvasStageService(deps);

  // The command takes no parameters, so there is nothing to validate.
  return function getCanvasViewHandler(_params: GetCanvasViewParams): Promise<GetCanvasViewResult> {
    try {
      return Promise.resolve(toWireCanvasView(service.getView()));
    } catch (error) {
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }
  };
}

export const getCanvasViewHandler = createGetCanvasViewHandler();
