import type { CombatAddressParams, GetCombatantGroupsResult } from '@/commands/types';
import { asError } from '@/commands/handlers/legacyWire';
import { parseRequest } from '@/core/shared';
import {
  combatantGroupsRequestSchema,
  createFoundryCombatantGroupService,
  toEncounterAddress,
  type CombatWiring
} from '@/core/combat';
import { toWireCombatantGroup } from './combatFeatureWireMappers';

export function createGetCombatantGroupsHandler(
  wiring: CombatWiring = {}
): (params: CombatAddressParams) => Promise<GetCombatantGroupsResult> {
  const service = createFoundryCombatantGroupService(wiring);

  return function getCombatantGroupsHandler(params: CombatAddressParams): Promise<GetCombatantGroupsResult> {
    try {
      const result = service.listGroups(toEncounterAddress(parseRequest(combatantGroupsRequestSchema, params)));
      return Promise.resolve({ combatId: result.combatId, groups: result.groups.map(toWireCombatantGroup) });
    } catch (error) {
      return Promise.reject(asError(error));
    }
  };
}

export const getCombatantGroupsHandler = createGetCombatantGroupsHandler();
