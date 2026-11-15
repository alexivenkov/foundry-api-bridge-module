import type { GetCanvasViewResult, GridPathMeasurement } from '@/commands/types';
import type { CanvasViewState, GridMeasurement } from '@/core/ui';

export function toWireGridMeasurement(measurement: GridMeasurement): GridPathMeasurement {
  return {
    distance: measurement.distance,
    cost: measurement.cost,
    spaces: measurement.spaces,
    diagonals: measurement.diagonals,
    euclidean: measurement.euclidean
  };
}

/** `levelId` exists only on cores with scene levels; elsewhere the key is left out. */
export function toWireCanvasView(view: CanvasViewState): GetCanvasViewResult {
  const result: GetCanvasViewResult = {
    sceneId: view.sceneId,
    sceneName: view.sceneName,
    x: view.center.x,
    y: view.center.y,
    scale: view.scale,
    visibleArea: {
      x: view.visibleArea.x,
      y: view.visibleArea.y,
      width: view.visibleArea.width,
      height: view.visibleArea.height
    }
  };
  if (view.levelId !== undefined) {
    result.levelId = view.levelId;
  }
  return result;
}
