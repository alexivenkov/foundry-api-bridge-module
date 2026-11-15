import type { UpdateAmbientSoundParams, UpdateAmbientSoundResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  createFoundryAmbientSoundService,
  toUpdateAmbientSoundCommand,
  updateAmbientSoundRequestSchema
} from '@/core/ambient-sounds';
import type { AmbientSoundHandlerDependencies } from './GetAmbientSoundsHandler';
import { toWireAmbientSoundResult } from './ambientSoundWireMappers';

export function createUpdateAmbientSoundHandler(
  deps: AmbientSoundHandlerDependencies = {}
): (params: UpdateAmbientSoundParams) => Promise<UpdateAmbientSoundResult> {
  const service = createFoundryAmbientSoundService(deps);

  return async function updateAmbientSoundHandler(
    params: UpdateAmbientSoundParams
  ): Promise<UpdateAmbientSoundResult> {
    const command = toUpdateAmbientSoundCommand(parseRequest(updateAmbientSoundRequestSchema, params));
    return toWireAmbientSoundResult(await service.updateAmbientSound(command));
  };
}

export const updateAmbientSoundHandler = createUpdateAmbientSoundHandler();
