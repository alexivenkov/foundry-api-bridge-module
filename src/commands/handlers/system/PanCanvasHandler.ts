import type { PanCanvasParams, PanCanvasResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  createFoundryCanvasViewService,
  panCanvasRequestSchema,
  toPanCanvasCommand,
  type CanvasProvider
} from '@/core/ui';

export interface CanvasViewHandlerDependencies {
  canvas?: CanvasProvider;
}

export function createPanCanvasHandler(
  deps: CanvasViewHandlerDependencies = {}
): (params: PanCanvasParams) => Promise<PanCanvasResult> {
  const service = createFoundryCanvasViewService(deps.canvas);

  return async function panCanvasHandler(params: PanCanvasParams): Promise<PanCanvasResult> {
    await service.panCanvas(toPanCanvasCommand(parseRequest(panCanvasRequestSchema, params)));
    return { panned: true };
  };
}

export const panCanvasHandler = createPanCanvasHandler();
