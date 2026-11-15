import type { DeleteAmbientSoundParams, DeleteAmbientSoundResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  createFoundryAmbientSoundService,
  deleteAmbientSoundRequestSchema,
  toDeleteAmbientSoundCommand
} from '@/core/ambient-sounds';
import type { AmbientSoundHandlerDependencies } from './GetAmbientSoundsHandler';

export function createDeleteAmbientSoundHandler(
  deps: AmbientSoundHandlerDependencies = {}
): (params: DeleteAmbientSoundParams) => Promise<DeleteAmbientSoundResult> {
  const service = createFoundryAmbientSoundService(deps);

  return async function deleteAmbientSoundHandler(
    params: DeleteAmbientSoundParams
  ): Promise<DeleteAmbientSoundResult> {
    const command = toDeleteAmbientSoundCommand(parseRequest(deleteAmbientSoundRequestSchema, params));
    const result = await service.deleteAmbientSound(command);
    return { deleted: true, ambientSoundId: result.ambientSoundId, sceneId: result.sceneId };
  };
}

export const deleteAmbientSoundHandler = createDeleteAmbientSoundHandler();
