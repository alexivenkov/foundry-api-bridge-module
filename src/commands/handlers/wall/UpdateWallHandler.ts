import type { UpdateWallParams, UpdateWallResult } from '@/commands/types';
import {
  getSceneById,
  getWall,
  mapWallToSummary,
  doorTypeToNumber,
  doorStateToNumber,
  restrictionToNumber,
  directionToNumber
} from './wallTypes';

export async function updateWallHandler(params: UpdateWallParams): Promise<UpdateWallResult> {
  const scene = getSceneById(params.sceneId);
  const wall = getWall(scene, params.wallId);

  const updateData: Record<string, unknown> = {};

  if (params.c !== undefined) {
    updateData['c'] = params.c;
  }
  if (params.door !== undefined) {
    updateData['door'] = doorTypeToNumber(params.door);
  }
  if (params.doorState !== undefined) {
    updateData['ds'] = doorStateToNumber(params.doorState);
  }
  if (params.move !== undefined) {
    updateData['move'] = restrictionToNumber(params.move);
  }
  if (params.sense !== undefined) {
    updateData['sense'] = restrictionToNumber(params.sense);
  }
  if (params.sound !== undefined) {
    updateData['sound'] = restrictionToNumber(params.sound);
  }
  if (params.light !== undefined) {
    updateData['light'] = restrictionToNumber(params.light);
  }
  if (params.dir !== undefined) {
    updateData['dir'] = directionToNumber(params.dir);
  }

  const updated = await wall.update(updateData);
  return mapWallToSummary(updated);
}
