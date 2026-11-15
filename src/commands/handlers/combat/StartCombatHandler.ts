import type { CombatIdParams, CombatResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  combatAddressRequestSchema,
  createFoundryCombatService,
  toCombatAddress,
  type CombatWiring
} from '@/core/combat';
import { toWireCombat } from './combatWireMappers';

export function createStartCombatHandler(
  wiring: CombatWiring = {}
): (params: CombatIdParams) => Promise<CombatResult> {
  const service = createFoundryCombatService(wiring);

  return async function startCombatHandler(params: CombatIdParams): Promise<CombatResult> {
    const command = toCombatAddress(parseRequest(combatAddressRequestSchema, params));
    return toWireCombat(await service.startCombat(command));
  };
}

export const startCombatHandler = createStartCombatHandler();
