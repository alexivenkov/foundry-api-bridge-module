import type { CombatIdParams, DeleteResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  combatAddressRequestSchema,
  createFoundryCombatService,
  toCombatAddress,
  type CombatWiring
} from '@/core/combat';

export function createDeleteCombatHandler(
  wiring: CombatWiring = {}
): (params: CombatIdParams) => Promise<DeleteResult> {
  const service = createFoundryCombatService(wiring);

  return async function deleteCombatHandler(params: CombatIdParams): Promise<DeleteResult> {
    await service.deleteCombat(toCombatAddress(parseRequest(combatAddressRequestSchema, params)));
    return { deleted: true };
  };
}

export const deleteCombatHandler = createDeleteCombatHandler();
