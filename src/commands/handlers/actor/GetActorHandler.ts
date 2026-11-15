import type { ActorDetailResult, GetActorParams } from '@/commands/types';
import { asError } from '@/commands/handlers/legacyWire';
import { createFoundryActorService, getActorRequestSchema, toGetActorQuery } from '@/core/actors';
import { parseRequest } from '@/core/shared';
import { toWireActorDetail, type ActorHandlerDependencies } from './actorWireMappers';

export function createGetActorHandler(
  deps: ActorHandlerDependencies = {}
): (params: GetActorParams) => Promise<ActorDetailResult> {
  const service = createFoundryActorService(deps.gameProvider);

  return function getActorHandler(params: GetActorParams): Promise<ActorDetailResult> {
    try {
      const query = toGetActorQuery(parseRequest(getActorRequestSchema, params));
      return Promise.resolve(toWireActorDetail(service.getActor(query)));
    } catch (error) {
      return Promise.reject(asError(error));
    }
  };
}

export const getActorHandler = createGetActorHandler();
