import type { DeleteResult, RemoveCombatantParams } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  combatantAddressRequestSchema,
  createFoundryCombatantService,
  toCombatantAddress,
  type CombatWiring
} from '@/core/combat';

export function createRemoveCombatantHandler(
  wiring: CombatWiring = {}
): (params: RemoveCombatantParams) => Promise<DeleteResult> {
  const service = createFoundryCombatantService(wiring);

  return async function removeCombatantHandler(params: RemoveCombatantParams): Promise<DeleteResult> {
    await service.removeCombatant(toCombatantAddress(parseRequest(combatantAddressRequestSchema, params)));
    return { deleted: true };
  };
}

export const removeCombatantHandler = createRemoveCombatantHandler();
