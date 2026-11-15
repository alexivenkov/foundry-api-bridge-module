import type { GetScenesListParams, SceneListResult } from '@/commands/types';
import { asError } from '@/commands/handlers/legacyWire';
import { createFoundrySceneQueryService, type SceneWiring } from '@/core/scenes';
import { toWireSceneListing } from './sceneWireMappers';

export function createGetScenesListHandler(
  wiring: SceneWiring = {}
): (params: GetScenesListParams) => Promise<SceneListResult> {
  const service = createFoundrySceneQueryService(wiring);

  // The command takes no parameters, so there is nothing to validate.
  return function getScenesListHandler(_params: GetScenesListParams): Promise<SceneListResult> {
    try {
      return Promise.resolve({ scenes: service.listScenes().map(toWireSceneListing) });
    } catch (error) {
      return Promise.reject(asError(error));
    }
  };
}

export const getScenesListHandler = createGetScenesListHandler();
