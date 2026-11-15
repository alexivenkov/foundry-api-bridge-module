import type { UpdateSceneParams, UpdateSceneResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  createFoundrySceneSettingsService,
  toUpdateSceneCommand,
  updateSceneRequestSchema,
  updateSceneSettingsRequestSchema,
  type SceneWiring
} from '@/core/scenes';
import { toWireConfiguredScene } from './sceneWireMappers';

export function createUpdateSceneHandler(
  wiring: SceneWiring = {}
): (params: UpdateSceneParams) => Promise<UpdateSceneResult> {
  const service = createFoundrySceneSettingsService(wiring);

  return async function updateSceneHandler(params: UpdateSceneParams): Promise<UpdateSceneResult> {
    const command = toUpdateSceneCommand(
      parseRequest(updateSceneRequestSchema, params),
      parseRequest(updateSceneSettingsRequestSchema, params)
    );
    return toWireConfiguredScene(await service.updateScene(command));
  };
}

export const updateSceneHandler = createUpdateSceneHandler();
