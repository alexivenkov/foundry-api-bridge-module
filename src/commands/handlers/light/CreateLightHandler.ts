import type { CreateLightParams, CreateLightResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import { createFoundryLightService, createLightRequestSchema, toCreateLightCommand } from '@/core/lights';
import type { LightHandlerDependencies } from './GetLightsHandler';
import { toWireLightResult } from './lightWireMappers';

export function createCreateLightHandler(
  deps: LightHandlerDependencies = {}
): (params: CreateLightParams) => Promise<CreateLightResult> {
  const service = createFoundryLightService(deps);

  return async function createLightHandler(params: CreateLightParams): Promise<CreateLightResult> {
    const command = toCreateLightCommand(parseRequest(createLightRequestSchema, params));
    return toWireLightResult(await service.createLight(command));
  };
}

export const createLightHandler = createCreateLightHandler();
