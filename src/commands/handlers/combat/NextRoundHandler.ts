import type { CombatAddressParams, CombatResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  createFoundryEncounterService,
  encounterAddressRequestSchema,
  toEncounterAddress,
  type CombatWiring
} from '@/core/combat';
import { toWireCombat } from './combatWireMappers';

export function createNextRoundHandler(
  wiring: CombatWiring = {}
): (params: CombatAddressParams) => Promise<CombatResult> {
  const service = createFoundryEncounterService(wiring);

  return async function nextRoundHandler(params: CombatAddressParams): Promise<CombatResult> {
    const command = toEncounterAddress(parseRequest(encounterAddressRequestSchema, params));
    return toWireCombat(await service.nextRound(command));
  };
}

export const nextRoundHandler = createNextRoundHandler();
