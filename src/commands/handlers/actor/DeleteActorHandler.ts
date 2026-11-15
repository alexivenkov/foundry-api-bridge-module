import type { DeleteActorParams, DeleteResult } from '@/commands/types';
import { createFoundryActorService, deleteActorRequestSchema, toDeleteActorCommand } from '@/core/actors';
import { parseRequest } from '@/core/shared';
import type { ActorHandlerDependencies } from './actorWireMappers';

export function createDeleteActorHandler(
  deps: ActorHandlerDependencies = {}
): (params: DeleteActorParams) => Promise<DeleteResult> {
  const service = createFoundryActorService(deps.gameProvider);

  return async function deleteActorHandler(params: DeleteActorParams): Promise<DeleteResult> {
    await service.deleteActor(toDeleteActorCommand(parseRequest(deleteActorRequestSchema, params)));
    return { deleted: true };
  };
}

export const deleteActorHandler = createDeleteActorHandler();
