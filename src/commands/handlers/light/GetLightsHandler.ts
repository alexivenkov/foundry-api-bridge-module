import type { GetLightsParams, GetLightsResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import { createFoundryLightService, getLightsRequestSchema, toListLightsQuery, type LightWiring } from '@/core/lights';
import { toWireLight } from './lightWireMappers';

export type LightHandlerDependencies = LightWiring;

export function createGetLightsHandler(
  deps: LightHandlerDependencies = {}
): (params: GetLightsParams) => Promise<GetLightsResult> {
  const service = createFoundryLightService(deps);

  return function getLightsHandler(params: GetLightsParams): Promise<GetLightsResult> {
    try {
      const result = service.listLights(toListLightsQuery(parseRequest(getLightsRequestSchema, params)));
      return Promise.resolve({ sceneId: result.sceneId, lights: result.lights.map(toWireLight) });
    } catch (error) {
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }
  };
}

export const getLightsHandler = createGetLightsHandler();
