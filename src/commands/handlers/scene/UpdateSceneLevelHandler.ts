import type { SceneLevelResult, UpdateSceneLevelParams } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  createFoundrySceneLevelService,
  toUpdateLevelCommand,
  updateLevelRequestSchema,
  type SceneWiring
} from '@/core/scenes';
import { toWireLevelResult } from './sceneWireMappers';

export function createUpdateSceneLevelHandler(
  wiring: SceneWiring = {}
): (params: UpdateSceneLevelParams) => Promise<SceneLevelResult> {
  const service = createFoundrySceneLevelService(wiring);

  return async function updateSceneLevelHandler(params: UpdateSceneLevelParams): Promise<SceneLevelResult> {
    const command = toUpdateLevelCommand(parseRequest(updateLevelRequestSchema, params));
    return toWireLevelResult(await service.updateLevel(command));
  };
}

export const updateSceneLevelHandler = createUpdateSceneLevelHandler();
