import type { PreloadSceneParams, PreloadSceneResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  createFoundrySceneTableService,
  preloadSceneRequestSchema,
  toPreloadSceneCommand,
  type SceneWiring
} from '@/core/scenes';

export function createPreloadSceneHandler(
  wiring: SceneWiring = {}
): (params: PreloadSceneParams) => Promise<PreloadSceneResult> {
  const service = createFoundrySceneTableService(wiring);

  return async function preloadSceneHandler(params: PreloadSceneParams): Promise<PreloadSceneResult> {
    const command = toPreloadSceneCommand(parseRequest(preloadSceneRequestSchema, params));
    const preloaded = await service.preloadScene(command);
    return preloaded.levelId === undefined
      ? { sceneId: preloaded.sceneId, preloading: true }
      : { sceneId: preloaded.sceneId, preloading: true, levelId: preloaded.levelId };
  };
}

export const preloadSceneHandler = createPreloadSceneHandler();
