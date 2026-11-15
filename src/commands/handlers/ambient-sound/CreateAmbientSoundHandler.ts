import type { CreateAmbientSoundParams, CreateAmbientSoundResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  createAmbientSoundRequestSchema,
  createFoundryAmbientSoundService,
  toCreateAmbientSoundCommand
} from '@/core/ambient-sounds';
import type { AmbientSoundHandlerDependencies } from './GetAmbientSoundsHandler';
import { toWireAmbientSoundResult } from './ambientSoundWireMappers';

export function createCreateAmbientSoundHandler(
  deps: AmbientSoundHandlerDependencies = {}
): (params: CreateAmbientSoundParams) => Promise<CreateAmbientSoundResult> {
  const service = createFoundryAmbientSoundService(deps);

  return async function createAmbientSoundHandler(
    params: CreateAmbientSoundParams
  ): Promise<CreateAmbientSoundResult> {
    const command = toCreateAmbientSoundCommand(parseRequest(createAmbientSoundRequestSchema, params));
    return toWireAmbientSoundResult(await service.createAmbientSound(command));
  };
}

export const createAmbientSoundHandler = createCreateAmbientSoundHandler();
