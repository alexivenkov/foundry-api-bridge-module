import type { UpdateLightParams, UpdateLightResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import { createFoundryLightService, toUpdateLightCommand, updateLightRequestSchema } from '@/core/lights';
import type { LightHandlerDependencies } from './GetLightsHandler';
import { toWireLightResult } from './lightWireMappers';

export function createUpdateLightHandler(
  deps: LightHandlerDependencies = {}
): (params: UpdateLightParams) => Promise<UpdateLightResult> {
  const service = createFoundryLightService(deps);

  return async function updateLightHandler(params: UpdateLightParams): Promise<UpdateLightResult> {
    const command = toUpdateLightCommand(parseRequest(updateLightRequestSchema, params));
    return toWireLightResult(await service.updateLight(command));
  };
}

export const updateLightHandler = createUpdateLightHandler();
