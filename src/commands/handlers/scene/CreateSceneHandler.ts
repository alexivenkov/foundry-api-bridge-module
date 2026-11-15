import type { CreateSceneParams, CreateSceneResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  createFoundrySceneSettingsService,
  createSceneRequestSchema,
  createSceneSettingsRequestSchema,
  toCreateSceneCommand,
  type SceneWiring
} from '@/core/scenes';
import { toWireConfiguredScene } from './sceneWireMappers';

export function createCreateSceneHandler(
  wiring: SceneWiring = {}
): (params: CreateSceneParams) => Promise<CreateSceneResult> {
  const service = createFoundrySceneSettingsService(wiring);

  return async function createSceneHandler(params: CreateSceneParams): Promise<CreateSceneResult> {
    const command = toCreateSceneCommand(
      parseRequest(createSceneRequestSchema, params),
      parseRequest(createSceneSettingsRequestSchema, params)
    );
    return toWireConfiguredScene(await service.createScene(command));
  };
}

export const createSceneHandler = createCreateSceneHandler();
