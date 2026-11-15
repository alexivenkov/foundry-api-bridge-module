import type { CombatantResult, SetCombatantDefeatedParams } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  createFoundryCombatantService,
  setCombatantDefeatedRequestSchema,
  toSetCombatantDefeatedCommand,
  type CombatWiring
} from '@/core/combat';
import { toWireCombatant } from './combatWireMappers';

export function createSetCombatantDefeatedHandler(
  wiring: CombatWiring = {}
): (params: SetCombatantDefeatedParams) => Promise<CombatantResult> {
  const service = createFoundryCombatantService(wiring);

  return async function setCombatantDefeatedHandler(params: SetCombatantDefeatedParams): Promise<CombatantResult> {
    const command = toSetCombatantDefeatedCommand(parseRequest(setCombatantDefeatedRequestSchema, params));
    return toWireCombatant(await service.setDefeated(command));
  };
}

export const setCombatantDefeatedHandler = createSetCombatantDefeatedHandler();
