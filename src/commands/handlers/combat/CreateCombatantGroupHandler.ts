import type { CombatantGroupResult, CreateCombatantGroupParams } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  createCombatantGroupRequestSchema,
  createFoundryCombatantGroupService,
  toCreateCombatantGroupCommand,
  type CombatWiring
} from '@/core/combat';
import { toWireCombatantGroupResult } from './combatFeatureWireMappers';

export function createCreateCombatantGroupHandler(
  wiring: CombatWiring = {}
): (params: CreateCombatantGroupParams) => Promise<CombatantGroupResult> {
  const service = createFoundryCombatantGroupService(wiring);

  return async function createCombatantGroupHandler(params: CreateCombatantGroupParams): Promise<CombatantGroupResult> {
    const command = toCreateCombatantGroupCommand(parseRequest(createCombatantGroupRequestSchema, params));
    return toWireCombatantGroupResult(await service.createGroup(command));
  };
}

export const createCombatantGroupHandler = createCreateCombatantGroupHandler();
