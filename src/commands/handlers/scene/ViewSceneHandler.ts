import type { ViewSceneParams, ViewSceneResult } from '@/commands/types';
import { getGameCrud } from './sceneTypes';

export async function viewSceneHandler(params: ViewSceneParams): Promise<ViewSceneResult> {
  const scene = getGameCrud().scenes.get(params.sceneId);
  if (!scene) {
    throw new Error(`Scene not found: ${params.sceneId}`);
  }

  await scene.view();

  return {
    viewed: true,
    sceneId: params.sceneId
  };
}
