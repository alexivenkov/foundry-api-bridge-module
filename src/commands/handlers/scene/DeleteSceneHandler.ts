import type { DeleteSceneParams, DeleteSceneResult } from '@/commands/types';
import { getGameCrud } from './sceneTypes';

export async function deleteSceneHandler(params: DeleteSceneParams): Promise<DeleteSceneResult> {
  const scene = getGameCrud().scenes.get(params.sceneId);
  if (!scene) {
    throw new Error(`Scene not found: ${params.sceneId}`);
  }

  await scene.delete();

  return {
    deleted: true,
    sceneId: params.sceneId
  };
}
