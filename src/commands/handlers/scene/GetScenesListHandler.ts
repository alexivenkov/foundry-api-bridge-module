import type { GetScenesListParams, SceneListResult, SceneSummaryResult } from '@/commands/types';
import { mapSceneToSummary, type FoundryGame } from './sceneTypes';

declare const game: FoundryGame;

export function getScenesListHandler(_params: GetScenesListParams): Promise<SceneListResult> {
  try {
    const scenes: SceneSummaryResult[] = [];
    game.scenes.forEach(scene => {
      scenes.push(mapSceneToSummary(scene));
    });
    return Promise.resolve({ scenes });
  } catch (error) {
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  }
}
