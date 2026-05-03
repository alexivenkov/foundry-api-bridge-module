import type { DeleteWallParams, DeleteWallResult } from '@/commands/types';
import { getSceneById, getWall } from './wallTypes';

export async function deleteWallHandler(params: DeleteWallParams): Promise<DeleteWallResult> {
  const scene = getSceneById(params.sceneId);
  getWall(scene, params.wallId);

  await scene.deleteEmbeddedDocuments('Wall', [params.wallId]);

  return {
    deleted: true,
    wallId: params.wallId,
    sceneId: scene.id
  };
}
