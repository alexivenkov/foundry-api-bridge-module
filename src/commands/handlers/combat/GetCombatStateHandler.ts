import type { CombatIdParams, CombatResult } from '@/commands/types';
import { asError } from '@/commands/handlers/legacyWire';
import { parseRequest } from '@/core/shared';
import {
  combatAddressRequestSchema,
  createFoundryCombatService,
  toCombatAddress,
  type CombatWiring
} from '@/core/combat';
import { toWireCombat } from './combatWireMappers';

export function createGetCombatStateHandler(
  wiring: CombatWiring = {}
): (params: CombatIdParams) => Promise<CombatResult> {
  const service = createFoundryCombatService(wiring);

  return function getCombatStateHandler(params: CombatIdParams): Promise<CombatResult> {
    try {
      const query = toCombatAddress(parseRequest(combatAddressRequestSchema, params));
      return Promise.resolve(toWireCombat(service.getCombat(query)));
    } catch (error) {
      return Promise.reject(asError(error));
    }
  };
}

export const getCombatStateHandler = createGetCombatStateHandler();
