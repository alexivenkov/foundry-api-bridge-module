import type { DeleteRegionParams, DeleteRegionResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import { createFoundryRegionService, deleteRegionRequestSchema, toDeleteRegionCommand } from '@/core/regions';
import type { RegionHandlerDependencies } from './GetRegionsHandler';

export function createDeleteRegionHandler(
  deps: RegionHandlerDependencies = {}
): (params: DeleteRegionParams) => Promise<DeleteRegionResult> {
  const service = createFoundryRegionService(deps);

  return async function deleteRegionHandler(params: DeleteRegionParams): Promise<DeleteRegionResult> {
    const result = await service.deleteRegion(toDeleteRegionCommand(parseRequest(deleteRegionRequestSchema, params)));
    return { deleted: true, regionId: result.regionId, sceneId: result.sceneId };
  };
}

export const deleteRegionHandler = createDeleteRegionHandler();
