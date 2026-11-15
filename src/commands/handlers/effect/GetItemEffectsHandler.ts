import type { GetItemEffectsParams, ItemEffectsResult } from '@/commands/types';
import { asError } from '@/commands/handlers/legacyWire';
import { createFoundryEffectDetailsService, getItemEffectsRequestSchema, toListItemEffectsQuery } from '@/core/effects';
import { parseRequest } from '@/core/shared';
import { toWireItemEffects, type EffectHandlerDependencies } from './effectWireMappers';

export function createGetItemEffectsHandler(
  deps: EffectHandlerDependencies = {}
): (params: GetItemEffectsParams) => Promise<ItemEffectsResult> {
  const service = createFoundryEffectDetailsService(deps.gameProvider, deps);

  return function getItemEffectsHandler(params: GetItemEffectsParams): Promise<ItemEffectsResult> {
    try {
      const query = toListItemEffectsQuery(parseRequest(getItemEffectsRequestSchema, params));
      return Promise.resolve(toWireItemEffects(service.listItemEffects(query)));
    } catch (error) {
      return Promise.reject(asError(error));
    }
  };
}

export const getItemEffectsHandler = createGetItemEffectsHandler();
