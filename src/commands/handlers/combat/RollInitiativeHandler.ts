import type { InitiativeRollResult, RollInitiativeParams } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  createFoundryCombatantService,
  rollInitiativeRequestSchema,
  toRollInitiativeCommand,
  type CombatWiring
} from '@/core/combat';
import { toWireInitiativeRolls } from './combatWireMappers';

export function createRollInitiativeHandler(
  wiring: CombatWiring = {}
): (params: RollInitiativeParams) => Promise<InitiativeRollResult> {
  const service = createFoundryCombatantService(wiring);

  return async function rollInitiativeHandler(params: RollInitiativeParams): Promise<InitiativeRollResult> {
    const command = toRollInitiativeCommand(parseRequest(rollInitiativeRequestSchema, params));
    return toWireInitiativeRolls(await service.rollInitiative(command));
  };
}

export const rollInitiativeHandler = createRollInitiativeHandler();
