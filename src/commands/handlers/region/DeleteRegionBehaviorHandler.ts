import type { DeleteRegionBehaviorParams, DeleteRegionBehaviorResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  createFoundryRegionBehaviorService,
  deleteRegionBehaviorRequestSchema,
  toDeleteRegionBehaviorCommand
} from '@/core/regions';
import type { RegionHandlerDependencies } from './GetRegionsHandler';

export function createDeleteRegionBehaviorHandler(
  deps: RegionHandlerDependencies = {}
): (params: DeleteRegionBehaviorParams) => Promise<DeleteRegionBehaviorResult> {
  const service = createFoundryRegionBehaviorService(deps);

  return async function deleteRegionBehaviorHandler(
    params: DeleteRegionBehaviorParams
  ): Promise<DeleteRegionBehaviorResult> {
    const command = toDeleteRegionBehaviorCommand(parseRequest(deleteRegionBehaviorRequestSchema, params));
    const result = await service.deleteBehavior(command);
    return { deleted: true, behaviorId: result.behaviorId, regionId: result.regionId, sceneId: result.sceneId };
  };
}

export const deleteRegionBehaviorHandler = createDeleteRegionBehaviorHandler();
