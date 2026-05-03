import type { CreateWallParams, CreateWallResult } from '@/commands/types';
import {
  getSceneById,
  mapWallToSummary,
  doorTypeToNumber,
  doorStateToNumber,
  restrictionToNumber,
  directionToNumber
} from './wallTypes';

export async function createWallHandler(params: CreateWallParams): Promise<CreateWallResult> {
  const scene = getSceneById(params.sceneId);

  const data: Record<string, unknown> = { c: params.c };

  if (params.door !== undefined) {
    data['door'] = doorTypeToNumber(params.door);
  }
  if (params.doorState !== undefined) {
    data['ds'] = doorStateToNumber(params.doorState);
  }
  if (params.move !== undefined) {
    data['move'] = restrictionToNumber(params.move);
  }
  if (params.sense !== undefined) {
    data['sense'] = restrictionToNumber(params.sense);
  }
  if (params.sound !== undefined) {
    data['sound'] = restrictionToNumber(params.sound);
  }
  if (params.light !== undefined) {
    data['light'] = restrictionToNumber(params.light);
  }
  if (params.dir !== undefined) {
    data['dir'] = directionToNumber(params.dir);
  }

  const created = await scene.createEmbeddedDocuments('Wall', [data]);
  const wall = created[0];

  if (!wall) {
    throw new Error('Wall creation returned no document');
  }

  return mapWallToSummary(wall);
}
