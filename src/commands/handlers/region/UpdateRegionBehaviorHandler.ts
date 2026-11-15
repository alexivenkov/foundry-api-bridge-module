import type { UpdateRegionBehaviorParams, UpdateRegionBehaviorResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  createFoundryRegionBehaviorService,
  toUpdateRegionBehaviorCommand,
  updateRegionBehaviorRequestSchema
} from '@/core/regions';
import type { RegionHandlerDependencies } from './GetRegionsHandler';
import { toWireBehaviorResult } from './regionWireMappers';

export function createUpdateRegionBehaviorHandler(
  deps: RegionHandlerDependencies = {}
): (params: UpdateRegionBehaviorParams) => Promise<UpdateRegionBehaviorResult> {
  const service = createFoundryRegionBehaviorService(deps);

  return async function updateRegionBehaviorHandler(
    params: UpdateRegionBehaviorParams
  ): Promise<UpdateRegionBehaviorResult> {
    const command = toUpdateRegionBehaviorCommand(parseRequest(updateRegionBehaviorRequestSchema, params));
    return toWireBehaviorResult(await service.updateBehavior(command));
  };
}

export const updateRegionBehaviorHandler = createUpdateRegionBehaviorHandler();
