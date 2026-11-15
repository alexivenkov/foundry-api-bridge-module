import type { CombatantResult, UpdateCombatantParams } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  createFoundryCombatantService,
  toUpdateCombatantCommand,
  updateCombatantRequestSchema,
  type CombatWiring
} from '@/core/combat';
import { toWireCombatant } from './combatWireMappers';

export function createUpdateCombatantHandler(
  wiring: CombatWiring = {}
): (params: UpdateCombatantParams) => Promise<CombatantResult> {
  const service = createFoundryCombatantService(wiring);

  return async function updateCombatantHandler(params: UpdateCombatantParams): Promise<CombatantResult> {
    const command = toUpdateCombatantCommand(parseRequest(updateCombatantRequestSchema, params));
    return toWireCombatant(await service.updateCombatant(command));
  };
}

export const updateCombatantHandler = createUpdateCombatantHandler();
