import type { GetWallsParams, GetWallsResult } from '@/commands/types';
import { getSceneById, mapWallToSummary } from './wallTypes';

export function getWallsHandler(params: GetWallsParams): Promise<GetWallsResult> {
  try {
    const scene = getSceneById(params.sceneId);
    const walls = scene.walls.contents.map(mapWallToSummary);
    return Promise.resolve({ sceneId: scene.id, walls });
  } catch (error) {
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  }
}
