import type { SnapToGridParams, SnapToGridResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import { createFoundryGridService, snapToGridRequestSchema, toSnapToGridCommand } from '@/core/ui';
import type { GridHandlerDependencies } from './MeasureGridPathHandler';

export function createSnapToGridHandler(
  deps: GridHandlerDependencies = {}
): (params: SnapToGridParams) => Promise<SnapToGridResult> {
  const service = createFoundryGridService(deps);

  return function snapToGridHandler(params: SnapToGridParams): Promise<SnapToGridResult> {
    try {
      const snapped = service.snapToGrid(toSnapToGridCommand(parseRequest(snapToGridRequestSchema, params)));
      return Promise.resolve({ sceneId: snapped.sceneId, x: snapped.point.x, y: snapped.point.y });
    } catch (error) {
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }
  };
}

export const snapToGridHandler = createSnapToGridHandler();
