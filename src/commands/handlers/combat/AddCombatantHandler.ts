import type { AddCombatantParams, CombatantResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  addCombatantRequestSchema,
  createFoundryCombatantService,
  toAddCombatantCommand,
  type CombatWiring
} from '@/core/combat';
import { toWireCombatant } from './combatWireMappers';

export function createAddCombatantHandler(
  wiring: CombatWiring = {}
): (params: AddCombatantParams) => Promise<CombatantResult> {
  const service = createFoundryCombatantService(wiring);

  return async function addCombatantHandler(params: AddCombatantParams): Promise<CombatantResult> {
    const command = toAddCombatantCommand(parseRequest(addCombatantRequestSchema, params));
    return toWireCombatant(await service.addCombatant(command));
  };
}

export const addCombatantHandler = createAddCombatantHandler();
