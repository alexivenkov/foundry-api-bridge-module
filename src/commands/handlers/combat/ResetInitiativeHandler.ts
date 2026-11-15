import type { CombatAddressParams, CombatResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  createFoundryEncounterService,
  encounterAddressRequestSchema,
  toEncounterAddress,
  type CombatWiring
} from '@/core/combat';
import { toWireCombat } from './combatWireMappers';

export function createResetInitiativeHandler(
  wiring: CombatWiring = {}
): (params: CombatAddressParams) => Promise<CombatResult> {
  const service = createFoundryEncounterService(wiring);

  return async function resetInitiativeHandler(params: CombatAddressParams): Promise<CombatResult> {
    const command = toEncounterAddress(parseRequest(encounterAddressRequestSchema, params));
    return toWireCombat(await service.resetInitiative(command));
  };
}

export const resetInitiativeHandler = createResetInitiativeHandler();
