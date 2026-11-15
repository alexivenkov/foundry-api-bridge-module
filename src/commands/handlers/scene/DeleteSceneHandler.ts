import type { DeleteSceneParams, DeleteSceneResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  createFoundrySceneService,
  sceneIdRequestSchema,
  toDeleteSceneCommand,
  type SceneWiring
} from '@/core/scenes';

export function createDeleteSceneHandler(
  wiring: SceneWiring = {}
): (params: DeleteSceneParams) => Promise<DeleteSceneResult> {
  const service = createFoundrySceneService(wiring);

  return async function deleteSceneHandler(params: DeleteSceneParams): Promise<DeleteSceneResult> {
    const command = toDeleteSceneCommand(parseRequest(sceneIdRequestSchema, params));
    await service.deleteScene(command);
    return { deleted: true, sceneId: command.sceneId };
  };
}

export const deleteSceneHandler = createDeleteSceneHandler();
