import type { DeleteCombatantGroupParams, DeleteCombatantGroupResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  combatantGroupAddressRequestSchema,
  createFoundryCombatantGroupService,
  toCombatantGroupAddress,
  type CombatWiring
} from '@/core/combat';

export function createDeleteCombatantGroupHandler(
  wiring: CombatWiring = {}
): (params: DeleteCombatantGroupParams) => Promise<DeleteCombatantGroupResult> {
  const service = createFoundryCombatantGroupService(wiring);

  return async function deleteCombatantGroupHandler(
    params: DeleteCombatantGroupParams
  ): Promise<DeleteCombatantGroupResult> {
    const command = toCombatantGroupAddress(parseRequest(combatantGroupAddressRequestSchema, params));
    const result = await service.deleteGroup(command);
    return { deleted: true, groupId: result.groupId, combatId: result.combatId };
  };
}

export const deleteCombatantGroupHandler = createDeleteCombatantGroupHandler();
