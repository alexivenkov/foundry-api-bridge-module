import type { ResetFogParams, ResetFogResult } from '@/commands/types';
import { asError } from '@/commands/handlers/legacyWire';
import { parseRequest } from '@/core/shared';
import {
  createFoundrySceneTableService,
  sceneTargetRequestSchema,
  toSceneTargetCommand,
  type SceneWiring
} from '@/core/scenes';

export function createResetFogHandler(wiring: SceneWiring = {}): (params: ResetFogParams) => Promise<ResetFogResult> {
  const service = createFoundrySceneTableService(wiring);

  return function resetFogHandler(params: ResetFogParams): Promise<ResetFogResult> {
    try {
      const scene = service.resetFog(toSceneTargetCommand(parseRequest(sceneTargetRequestSchema, params)));
      return Promise.resolve({ sceneId: scene.id, reset: true });
    } catch (error) {
      return Promise.reject(asError(error));
    }
  };
}

export const resetFogHandler = createResetFogHandler();
