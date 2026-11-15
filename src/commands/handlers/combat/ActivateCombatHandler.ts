import type { CombatAddressParams, CombatEncounterSummary } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  createFoundryEncounterService,
  encounterAddressRequestSchema,
  toEncounterAddress,
  type CombatWiring
} from '@/core/combat';
import { toWireEncounter } from './combatFeatureWireMappers';

export function createActivateCombatHandler(
  wiring: CombatWiring = {}
): (params: CombatAddressParams) => Promise<CombatEncounterSummary> {
  const service = createFoundryEncounterService(wiring);

  return async function activateCombatHandler(params: CombatAddressParams): Promise<CombatEncounterSummary> {
    const command = toEncounterAddress(parseRequest(encounterAddressRequestSchema, params));
    return toWireEncounter(await service.activateCombat(command));
  };
}

export const activateCombatHandler = createActivateCombatHandler();
