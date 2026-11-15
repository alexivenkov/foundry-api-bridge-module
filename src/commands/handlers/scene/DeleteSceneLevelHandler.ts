import type { DeleteSceneLevelParams, DeleteSceneLevelResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  createFoundrySceneLevelService,
  deleteLevelRequestSchema,
  toDeleteLevelCommand,
  type SceneWiring
} from '@/core/scenes';

export function createDeleteSceneLevelHandler(
  wiring: SceneWiring = {}
): (params: DeleteSceneLevelParams) => Promise<DeleteSceneLevelResult> {
  const service = createFoundrySceneLevelService(wiring);

  return async function deleteSceneLevelHandler(params: DeleteSceneLevelParams): Promise<DeleteSceneLevelResult> {
    const command = toDeleteLevelCommand(parseRequest(deleteLevelRequestSchema, params));
    const deleted = await service.deleteLevel(command);
    return { deleted: true, levelId: deleted.levelId, sceneId: deleted.sceneId };
  };
}

export const deleteSceneLevelHandler = createDeleteSceneLevelHandler();
