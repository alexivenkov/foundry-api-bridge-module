import type { GetRegionParams, GetRegionResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import { createFoundryRegionService, getRegionRequestSchema, toGetRegionQuery } from '@/core/regions';
import type { RegionHandlerDependencies } from './GetRegionsHandler';
import { toWireRegionResult } from './regionWireMappers';
import { runSync } from './runSync';

export function createGetRegionHandler(
  deps: RegionHandlerDependencies = {}
): (params: GetRegionParams) => Promise<GetRegionResult> {
  const service = createFoundryRegionService(deps);

  return function getRegionHandler(params: GetRegionParams): Promise<GetRegionResult> {
    return runSync(() =>
      toWireRegionResult(service.getRegion(toGetRegionQuery(parseRequest(getRegionRequestSchema, params))))
    );
  };
}

export const getRegionHandler = createGetRegionHandler();
