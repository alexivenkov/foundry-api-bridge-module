import type { CombatantResult, SetInitiativeParams } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  createFoundryCombatantService,
  setInitiativeRequestSchema,
  toSetInitiativeCommand,
  type CombatWiring
} from '@/core/combat';
import { toWireCombatant } from './combatWireMappers';

export function createSetInitiativeHandler(
  wiring: CombatWiring = {}
): (params: SetInitiativeParams) => Promise<CombatantResult> {
  const service = createFoundryCombatantService(wiring);

  return async function setInitiativeHandler(params: SetInitiativeParams): Promise<CombatantResult> {
    const command = toSetInitiativeCommand(parseRequest(setInitiativeRequestSchema, params));
    return toWireCombatant(await service.setInitiative(command));
  };
}

export const setInitiativeHandler = createSetInitiativeHandler();
