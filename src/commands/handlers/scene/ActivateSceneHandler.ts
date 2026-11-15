import type { ActivateSceneParams, ActivateSceneResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  createFoundrySceneService,
  sceneIdRequestSchema,
  toActivateSceneCommand,
  type SceneWiring
} from '@/core/scenes';

export function createActivateSceneHandler(
  wiring: SceneWiring = {}
): (params: ActivateSceneParams) => Promise<ActivateSceneResult> {
  const service = createFoundrySceneService(wiring);

  return async function activateSceneHandler(params: ActivateSceneParams): Promise<ActivateSceneResult> {
    const command = toActivateSceneCommand(parseRequest(sceneIdRequestSchema, params));
    const scene = await service.activateScene(command);
    return { id: scene.id, name: scene.name, active: true };
  };
}

export const activateSceneHandler = createActivateSceneHandler();
