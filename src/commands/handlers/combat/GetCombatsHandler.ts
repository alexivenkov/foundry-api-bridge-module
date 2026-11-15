import type { GetCombatsParams, GetCombatsResult } from '@/commands/types';
import { asError } from '@/commands/handlers/legacyWire';
import { parseRequest } from '@/core/shared';
import { createFoundryEncounterService, getCombatsRequestSchema, type CombatWiring } from '@/core/combat';
import { toWireEncounter } from './combatFeatureWireMappers';

export function createGetCombatsHandler(
  wiring: CombatWiring = {}
): (params: GetCombatsParams) => Promise<GetCombatsResult> {
  const service = createFoundryEncounterService(wiring);

  return function getCombatsHandler(params: GetCombatsParams): Promise<GetCombatsResult> {
    try {
      parseRequest(getCombatsRequestSchema, params);
      return Promise.resolve({ combats: service.listEncounters().map(toWireEncounter) });
    } catch (error) {
      return Promise.reject(asError(error));
    }
  };
}

export const getCombatsHandler = createGetCombatsHandler();
