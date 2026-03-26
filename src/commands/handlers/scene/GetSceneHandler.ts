import type { GetSceneParams, SceneDetailResult } from '@/commands/types';
import { getScene, mapSceneToDetail, type FoundryGame } from './sceneTypes';

declare const game: FoundryGame;

export function getSceneHandler(params: GetSceneParams): Promise<SceneDetailResult> {
  try {
    const scene = getScene(game, params.sceneId);
    return Promise.resolve(mapSceneToDetail(scene));
  } catch (error) {
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  }
}
