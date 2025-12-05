import type { GetSceneTokensParams, SceneTokensResult } from '@/commands/types';
import { getActiveScene, mapTokenToResult, type FoundryGame } from './tokenTypes';

declare const game: FoundryGame;

export function getSceneTokensHandler(params: GetSceneTokensParams): Promise<SceneTokensResult> {
  try {
    const scene = getActiveScene(game, params.sceneId);
    return Promise.resolve({
      sceneId: scene.id,
      sceneName: scene.name,
      tokens: scene.tokens.contents.map(mapTokenToResult)
    });
  } catch (error) {
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  }
}