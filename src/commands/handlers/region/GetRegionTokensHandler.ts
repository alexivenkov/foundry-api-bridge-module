import type { GetRegionTokensParams, GetRegionTokensResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import { createFoundryRegionService, getRegionTokensRequestSchema, toListRegionTokensQuery } from '@/core/regions';
import type { RegionHandlerDependencies } from './GetRegionsHandler';
import { runSync } from './runSync';

export function createGetRegionTokensHandler(
  deps: RegionHandlerDependencies = {}
): (params: GetRegionTokensParams) => Promise<GetRegionTokensResult> {
  const service = createFoundryRegionService(deps);

  return function getRegionTokensHandler(params: GetRegionTokensParams): Promise<GetRegionTokensResult> {
    return runSync(() => {
      const query = toListRegionTokensQuery(parseRequest(getRegionTokensRequestSchema, params));
      const result = service.listTokensInside(query);
      return {
        sceneId: result.sceneId,
        regionId: result.regionId,
        tokens: result.tokens.map((token) => ({ id: token.id, name: token.name }))
      };
    });
  };
}

export const getRegionTokensHandler = createGetRegionTokensHandler();
