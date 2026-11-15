import type { InitiativeRollResult, RollAllInitiativeParams } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  createFoundryCombatantService,
  rollAllInitiativeRequestSchema,
  toRollAllInitiativeCommand,
  type CombatWiring
} from '@/core/combat';
import { toWireInitiativeRolls } from './combatWireMappers';

export function createRollAllInitiativeHandler(
  wiring: CombatWiring = {}
): (params: RollAllInitiativeParams) => Promise<InitiativeRollResult> {
  const service = createFoundryCombatantService(wiring);

  return async function rollAllInitiativeHandler(params: RollAllInitiativeParams): Promise<InitiativeRollResult> {
    const command = toRollAllInitiativeCommand(parseRequest(rollAllInitiativeRequestSchema, params));
    return toWireInitiativeRolls(await service.rollAllInitiative(command));
  };
}

export const rollAllInitiativeHandler = createRollAllInitiativeHandler();
