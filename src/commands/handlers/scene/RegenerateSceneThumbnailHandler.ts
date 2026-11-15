import type { RegenerateSceneThumbnailParams, RegenerateSceneThumbnailResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  createFoundrySceneTableService,
  sceneTargetRequestSchema,
  toSceneTargetCommand,
  type SceneWiring
} from '@/core/scenes';

export function createRegenerateSceneThumbnailHandler(
  wiring: SceneWiring = {}
): (params: RegenerateSceneThumbnailParams) => Promise<RegenerateSceneThumbnailResult> {
  const service = createFoundrySceneTableService(wiring);

  return async function regenerateSceneThumbnailHandler(
    params: RegenerateSceneThumbnailParams
  ): Promise<RegenerateSceneThumbnailResult> {
    const command = toSceneTargetCommand(parseRequest(sceneTargetRequestSchema, params));
    const thumbnail = await service.regenerateThumbnail(command);
    return { sceneId: thumbnail.sceneId, thumb: thumbnail.thumb };
  };
}

export const regenerateSceneThumbnailHandler = createRegenerateSceneThumbnailHandler();
