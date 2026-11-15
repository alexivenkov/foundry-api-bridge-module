import type { CreateSceneLevelParams, SceneLevelResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  createFoundrySceneLevelService,
  createLevelRequestSchema,
  toCreateLevelCommand,
  type SceneWiring
} from '@/core/scenes';
import { toWireLevelResult } from './sceneWireMappers';

export function createCreateSceneLevelHandler(
  wiring: SceneWiring = {}
): (params: CreateSceneLevelParams) => Promise<SceneLevelResult> {
  const service = createFoundrySceneLevelService(wiring);

  return async function createSceneLevelHandler(params: CreateSceneLevelParams): Promise<SceneLevelResult> {
    const command = toCreateLevelCommand(parseRequest(createLevelRequestSchema, params));
    return toWireLevelResult(await service.createLevel(command));
  };
}

export const createSceneLevelHandler = createCreateSceneLevelHandler();
