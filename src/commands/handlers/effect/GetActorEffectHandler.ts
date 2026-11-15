import type { ActorEffectResult, GetActorEffectParams } from '@/commands/types';
import { asError } from '@/commands/handlers/legacyWire';
import { createFoundryEffectDetailsService, getActorEffectRequestSchema, toGetActorEffectQuery } from '@/core/effects';
import { parseRequest } from '@/core/shared';
import { toWireActorEffectDetails, type EffectHandlerDependencies } from './effectWireMappers';

export function createGetActorEffectHandler(
  deps: EffectHandlerDependencies = {}
): (params: GetActorEffectParams) => Promise<ActorEffectResult> {
  const service = createFoundryEffectDetailsService(deps.gameProvider, deps);

  return function getActorEffectHandler(params: GetActorEffectParams): Promise<ActorEffectResult> {
    try {
      const query = toGetActorEffectQuery(parseRequest(getActorEffectRequestSchema, params));
      return Promise.resolve(toWireActorEffectDetails(service.getActorEffect(query)));
    } catch (error) {
      return Promise.reject(asError(error));
    }
  };
}

export const getActorEffectHandler = createGetActorEffectHandler();
