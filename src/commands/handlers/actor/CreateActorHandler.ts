import type { ActorResult, CreateActorParams } from '@/commands/types';
import { createActorRequestSchema, createFoundryActorService, toCreateActorCommand } from '@/core/actors';
import { parseRequest } from '@/core/shared';
import { toWireActorResult, type ActorHandlerDependencies } from './actorWireMappers';

export function createCreateActorHandler(
  deps: ActorHandlerDependencies = {}
): (params: CreateActorParams) => Promise<ActorResult> {
  const service = createFoundryActorService(deps.gameProvider, deps);

  return async function createActorHandler(params: CreateActorParams): Promise<ActorResult> {
    const command = toCreateActorCommand(parseRequest(createActorRequestSchema, params));
    return toWireActorResult(await service.createActor(command));
  };
}

export const createActorHandler = createCreateActorHandler();
