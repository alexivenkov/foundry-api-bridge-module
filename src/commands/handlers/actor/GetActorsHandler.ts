import type { ActorSummary } from '@/commands/types';
import { asError } from '@/commands/handlers/legacyWire';
import { createFoundryActorService } from '@/core/actors';
import { toWireActorSummary, type ActorHandlerDependencies } from './actorWireMappers';

export function createGetActorsHandler(
  deps: ActorHandlerDependencies = {}
): (params: Record<string, never>) => Promise<ActorSummary[]> {
  const service = createFoundryActorService(deps.gameProvider);

  // The command takes no parameters, so there is nothing to validate.
  return function getActorsHandler(_params: Record<string, never>): Promise<ActorSummary[]> {
    try {
      return Promise.resolve(service.listActors().map(toWireActorSummary));
    } catch (error) {
      return Promise.reject(asError(error));
    }
  };
}

export const getActorsHandler = createGetActorsHandler();
