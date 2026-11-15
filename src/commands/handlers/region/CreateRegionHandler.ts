import type { CreateRegionParams, CreateRegionResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import { createFoundryRegionService, createRegionRequestSchema, toCreateRegionCommand } from '@/core/regions';
import type { RegionHandlerDependencies } from './GetRegionsHandler';
import { toWireRegionResult } from './regionWireMappers';

export function createCreateRegionHandler(
  deps: RegionHandlerDependencies = {}
): (params: CreateRegionParams) => Promise<CreateRegionResult> {
  const service = createFoundryRegionService(deps);

  return async function createRegionHandler(params: CreateRegionParams): Promise<CreateRegionResult> {
    const command = toCreateRegionCommand(parseRequest(createRegionRequestSchema, params));
    return toWireRegionResult(await service.createRegion(command));
  };
}

export const createRegionHandler = createCreateRegionHandler();
