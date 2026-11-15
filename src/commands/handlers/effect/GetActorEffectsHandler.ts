import type { ActorEffectsResult, GetActorEffectsParams } from '@/commands/types';
import { asError, withShortNoActiveScene } from '@/commands/handlers/legacyWire';
import { createFoundryEffectService, getActorEffectsRequestSchema, toListEffectsQuery } from '@/core/effects';
import { parseRequest } from '@/core/shared';
import { toWireActorEffects, type EffectHandlerDependencies } from './effectWireMappers';

export function createGetActorEffectsHandler(
  deps: EffectHandlerDependencies = {}
): (params: GetActorEffectsParams) => Promise<ActorEffectsResult> {
  const service = createFoundryEffectService(deps.gameProvider, deps);

  return function getActorEffectsHandler(params: GetActorEffectsParams): Promise<ActorEffectsResult> {
    try {
      const query = toListEffectsQuery(parseRequest(getActorEffectsRequestSchema, params));
      return Promise.resolve(toWireActorEffects(service.listEffects(query)));
    } catch (error) {
      return Promise.reject(asError(withShortNoActiveScene(error)));
    }
  };
}

export const getActorEffectsHandler = createGetActorEffectsHandler();
