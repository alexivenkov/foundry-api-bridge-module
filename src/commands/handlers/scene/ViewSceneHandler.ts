import type { ViewSceneParams, ViewSceneResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  createFoundrySceneTableService,
  toViewSceneCommand,
  viewSceneRequestSchema,
  type SceneWiring
} from '@/core/scenes';

export function createViewSceneHandler(
  wiring: SceneWiring = {}
): (params: ViewSceneParams) => Promise<ViewSceneResult> {
  const service = createFoundrySceneTableService(wiring);

  return async function viewSceneHandler(params: ViewSceneParams): Promise<ViewSceneResult> {
    const command = toViewSceneCommand(parseRequest(viewSceneRequestSchema, params));
    const viewed = await service.viewScene(command);
    return viewed.levelId === undefined
      ? { viewed: true, sceneId: command.sceneId }
      : { viewed: true, sceneId: command.sceneId, levelId: viewed.levelId };
  };
}

export const viewSceneHandler = createViewSceneHandler();
