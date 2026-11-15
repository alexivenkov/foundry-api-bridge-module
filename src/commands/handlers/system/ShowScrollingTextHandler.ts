import type { ShowScrollingTextParams, ShowScrollingTextResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import { createFoundryCanvasStageService, showScrollingTextRequestSchema, toShowScrollingTextCommand } from '@/core/ui';
import type { CanvasStageHandlerDependencies } from './GetCanvasViewHandler';

export function createShowScrollingTextHandler(
  deps: CanvasStageHandlerDependencies = {}
): (params: ShowScrollingTextParams) => Promise<ShowScrollingTextResult> {
  const service = createFoundryCanvasStageService(deps);

  return function showScrollingTextHandler(params: ShowScrollingTextParams): Promise<ShowScrollingTextResult> {
    try {
      const command = toShowScrollingTextCommand(parseRequest(showScrollingTextRequestSchema, params));
      const result = service.showScrollingText(command);
      return Promise.resolve({
        shown: result.shown,
        sceneId: result.sceneId,
        x: command.text.origin.x,
        y: command.text.origin.y
      });
    } catch (error) {
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }
  };
}

export const showScrollingTextHandler = createShowScrollingTextHandler();
