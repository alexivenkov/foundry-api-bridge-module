import type { CombatantResult, ToggleCombatantVisibilityParams } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  combatantAddressRequestSchema,
  createFoundryCombatantService,
  toCombatantAddress,
  type CombatWiring
} from '@/core/combat';
import { toWireCombatant } from './combatWireMappers';

export function createToggleCombatantVisibilityHandler(
  wiring: CombatWiring = {}
): (params: ToggleCombatantVisibilityParams) => Promise<CombatantResult> {
  const service = createFoundryCombatantService(wiring);

  return async function toggleCombatantVisibilityHandler(
    params: ToggleCombatantVisibilityParams
  ): Promise<CombatantResult> {
    const command = toCombatantAddress(parseRequest(combatantAddressRequestSchema, params));
    return toWireCombatant(await service.toggleVisibility(command));
  };
}

export const toggleCombatantVisibilityHandler = createToggleCombatantVisibilityHandler();
