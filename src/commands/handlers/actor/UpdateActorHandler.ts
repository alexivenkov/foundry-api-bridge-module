import type { ActorResult, UpdateActorParams } from '@/commands/types';
import { withShortNoActiveScene } from '@/commands/handlers/legacyWire';
import { createFoundryActorService, toUpdateActorCommand, updateActorRequestSchema } from '@/core/actors';
import { parseRequest } from '@/core/shared';
import { toWireActorUpdateResult, type ActorHandlerDependencies } from './actorWireMappers';

export function createUpdateActorHandler(
  deps: ActorHandlerDependencies = {}
): (params: UpdateActorParams) => Promise<ActorResult> {
  const service = createFoundryActorService(deps.gameProvider, deps);

  return async function updateActorHandler(params: UpdateActorParams): Promise<ActorResult> {
    const command = toUpdateActorCommand(parseRequest(updateActorRequestSchema, params));
    try {
      return toWireActorUpdateResult(await service.updateActor(command));
    } catch (error) {
      throw withShortNoActiveScene(error);
    }
  };
}

export const updateActorHandler = createUpdateActorHandler();
