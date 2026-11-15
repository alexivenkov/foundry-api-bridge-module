import type { CombatTurnContext, GetCombatTurnContextParams } from '@/commands/types';
import { asError } from '@/commands/handlers/legacyWire';
import { parseRequest } from '@/core/shared';
import {
  combatAddressRequestSchema,
  createFoundryTurnContextService,
  toCombatAddress,
  type CombatWiring
} from '@/core/combat';
import { toWireTurnContext } from './combatWireMappers';

export function createGetCombatTurnContextHandler(
  wiring: CombatWiring = {}
): (params: GetCombatTurnContextParams) => Promise<CombatTurnContext> {
  const service = createFoundryTurnContextService(wiring);

  return function getCombatTurnContextHandler(params: GetCombatTurnContextParams): Promise<CombatTurnContext> {
    try {
      const query = toCombatAddress(parseRequest(combatAddressRequestSchema, params));
      return Promise.resolve(toWireTurnContext(service.describeTurn(query)));
    } catch (error) {
      return Promise.reject(asError(error));
    }
  };
}

export const getCombatTurnContextHandler = createGetCombatTurnContextHandler();
