import type { UpdateRegionParams, UpdateRegionResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import { createFoundryRegionService, toUpdateRegionCommand, updateRegionRequestSchema } from '@/core/regions';
import type { RegionHandlerDependencies } from './GetRegionsHandler';
import { toWireRegionResult } from './regionWireMappers';

export function createUpdateRegionHandler(
  deps: RegionHandlerDependencies = {}
): (params: UpdateRegionParams) => Promise<UpdateRegionResult> {
  const service = createFoundryRegionService(deps);

  return async function updateRegionHandler(params: UpdateRegionParams): Promise<UpdateRegionResult> {
    const command = toUpdateRegionCommand(parseRequest(updateRegionRequestSchema, params));
    return toWireRegionResult(await service.updateRegion(command));
  };
}

export const updateRegionHandler = createUpdateRegionHandler();
