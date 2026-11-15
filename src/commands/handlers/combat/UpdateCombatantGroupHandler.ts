import type { CombatantGroupResult, UpdateCombatantGroupParams } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  createFoundryCombatantGroupService,
  toUpdateCombatantGroupCommand,
  updateCombatantGroupRequestSchema,
  type CombatWiring
} from '@/core/combat';
import { toWireCombatantGroupResult } from './combatFeatureWireMappers';

export function createUpdateCombatantGroupHandler(
  wiring: CombatWiring = {}
): (params: UpdateCombatantGroupParams) => Promise<CombatantGroupResult> {
  const service = createFoundryCombatantGroupService(wiring);

  return async function updateCombatantGroupHandler(params: UpdateCombatantGroupParams): Promise<CombatantGroupResult> {
    const command = toUpdateCombatantGroupCommand(parseRequest(updateCombatantGroupRequestSchema, params));
    return toWireCombatantGroupResult(await service.updateGroup(command));
  };
}

export const updateCombatantGroupHandler = createUpdateCombatantGroupHandler();
