import type { GetSceneParams, SceneDetailResult } from '@/commands/types';
import { asError, withShortNoActiveScene } from '@/commands/handlers/legacyWire';
import { parseRequest } from '@/core/shared';
import {
  createFoundrySceneSettingsService,
  getSceneRequestSchema,
  toDescribeSceneQuery,
  type SceneWiring
} from '@/core/scenes';
import { toWireSceneDetail } from './sceneWireMappers';

export function createGetSceneHandler(
  wiring: SceneWiring = {}
): (params: GetSceneParams) => Promise<SceneDetailResult> {
  const service = createFoundrySceneSettingsService(wiring);

  return function getSceneHandler(params: GetSceneParams): Promise<SceneDetailResult> {
    try {
      const query = toDescribeSceneQuery(parseRequest(getSceneRequestSchema, params));
      return Promise.resolve(toWireSceneDetail(service.describeScene(query)));
    } catch (error) {
      return Promise.reject(asError(withShortNoActiveScene(error)));
    }
  };
}

export const getSceneHandler = createGetSceneHandler();
