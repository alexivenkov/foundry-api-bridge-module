import type { ActivateSceneParams, ActivateSceneResult } from '@/commands/types';
import type { FoundryGame } from './sceneTypes';

declare const game: FoundryGame;

export async function activateSceneHandler(params: ActivateSceneParams): Promise<ActivateSceneResult> {
  const scene = game.scenes.get(params.sceneId);
  if (!scene) {
    throw new Error(`Scene not found: ${params.sceneId}`);
  }

  await scene.activate();

  return {
    id: scene.id,
    name: scene.name,
    active: true
  };
}
