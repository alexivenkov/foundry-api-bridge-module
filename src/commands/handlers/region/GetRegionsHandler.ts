import type { GetRegionsParams, GetRegionsResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  createFoundryRegionService,
  getRegionsRequestSchema,
  toListRegionsQuery,
  type RegionWiring
} from '@/core/regions';
import { toWireRegionSummary } from './regionWireMappers';
import { runSync } from './runSync';

export type RegionHandlerDependencies = RegionWiring;

export function createGetRegionsHandler(
  deps: RegionHandlerDependencies = {}
): (params: GetRegionsParams) => Promise<GetRegionsResult> {
  const service = createFoundryRegionService(deps);

  return function getRegionsHandler(params: GetRegionsParams): Promise<GetRegionsResult> {
    return runSync(() => {
      const result = service.listRegions(toListRegionsQuery(parseRequest(getRegionsRequestSchema, params)));
      return { sceneId: result.sceneId, regions: result.regions.map(toWireRegionSummary) };
    });
  };
}

export const getRegionsHandler = createGetRegionsHandler();
