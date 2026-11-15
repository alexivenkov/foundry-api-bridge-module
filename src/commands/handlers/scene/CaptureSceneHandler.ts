import type { CaptureSceneParams, CaptureSceneResult } from '@/commands/types';
import {
  CanvasNotReadyError,
  createFoundrySceneQueryService,
  type SceneWiring,
  type ViewportCapture
} from '@/core/scenes';
import { toWireCapture } from './sceneWireMappers';

export function createCaptureSceneHandler(
  wiring: SceneWiring = {}
): (params: CaptureSceneParams) => Promise<CaptureSceneResult> {
  const service = createFoundrySceneQueryService(wiring);

  // The command takes no parameters, so there is nothing to validate.
  return function captureSceneHandler(_params: CaptureSceneParams): Promise<CaptureSceneResult> {
    let capture: ViewportCapture;
    try {
      capture = service.captureViewport();
    } catch (error) {
      // Legacy contract of this command: a canvas that is not ready rejects,
      // while a failing renderer throws before any promise exists.
      if (error instanceof CanvasNotReadyError) {
        return Promise.reject(error);
      }
      throw error;
    }
    return Promise.resolve(toWireCapture(capture));
  };
}

export const captureSceneHandler = createCaptureSceneHandler();
