import type { GetSceneLevelsParams, GetSceneLevelsResult } from '@/commands/types';
import { asError } from '@/commands/handlers/legacyWire';
import { parseRequest } from '@/core/shared';
import {
  createFoundrySceneLevelService,
  sceneTargetRequestSchema,
  toSceneTargetCommand,
  type SceneWiring
} from '@/core/scenes';
import { toWireSceneLevels } from './sceneWireMappers';

export function createGetSceneLevelsHandler(
  wiring: SceneWiring = {}
): (params: GetSceneLevelsParams) => Promise<GetSceneLevelsResult> {
  const service = createFoundrySceneLevelService(wiring);

  return function getSceneLevelsHandler(params: GetSceneLevelsParams): Promise<GetSceneLevelsResult> {
    try {
      const query = toSceneTargetCommand(parseRequest(sceneTargetRequestSchema, params));
      return Promise.resolve(toWireSceneLevels(service.listLevels(query)));
    } catch (error) {
      return Promise.reject(asError(error));
    }
  };
}

export const getSceneLevelsHandler = createGetSceneLevelsHandler();
