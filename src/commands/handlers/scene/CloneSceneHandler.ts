import type { CloneSceneParams, CloneSceneResult } from '@/commands/types';
import { getGameCrud, mapSceneToCrudSummary } from './sceneTypes';

export async function cloneSceneHandler(params: CloneSceneParams): Promise<CloneSceneResult> {
  const source = getGameCrud().scenes.get(params.sourceId);
  if (!source) {
    throw new Error(`Source scene not found: ${params.sourceId}`);
  }

  const cloneData: Record<string, unknown> = {};
  if (params.name !== undefined) {
    cloneData['name'] = params.name;
  }
  if (params.folder !== undefined) {
    cloneData['folder'] = params.folder;
  }

  const cloned = await source.clone(cloneData, { save: true });
  return mapSceneToCrudSummary(cloned);
}
