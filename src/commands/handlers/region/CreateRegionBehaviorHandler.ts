import type { CreateRegionBehaviorParams, CreateRegionBehaviorResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  createFoundryRegionBehaviorService,
  createRegionBehaviorRequestSchema,
  toCreateRegionBehaviorCommand
} from '@/core/regions';
import type { RegionHandlerDependencies } from './GetRegionsHandler';
import { toWireBehaviorResult } from './regionWireMappers';

export function createCreateRegionBehaviorHandler(
  deps: RegionHandlerDependencies = {}
): (params: CreateRegionBehaviorParams) => Promise<CreateRegionBehaviorResult> {
  const service = createFoundryRegionBehaviorService(deps);

  return async function createRegionBehaviorHandler(
    params: CreateRegionBehaviorParams
  ): Promise<CreateRegionBehaviorResult> {
    const command = toCreateRegionBehaviorCommand(parseRequest(createRegionBehaviorRequestSchema, params));
    return toWireBehaviorResult(await service.createBehavior(command));
  };
}

export const createRegionBehaviorHandler = createCreateRegionBehaviorHandler();
