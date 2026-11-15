import type { CombatResult, CreateCombatParams } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  createCombatRequestSchema,
  createFoundryCombatService,
  toCreateCombatCommand,
  type CombatWiring
} from '@/core/combat';
import { toWireCombat } from './combatWireMappers';

export function createCreateCombatHandler(
  wiring: CombatWiring = {}
): (params: CreateCombatParams) => Promise<CombatResult> {
  const service = createFoundryCombatService(wiring);

  return async function createCombatHandler(params: CreateCombatParams): Promise<CombatResult> {
    const command = toCreateCombatCommand(parseRequest(createCombatRequestSchema, params));
    return toWireCombat(await service.createCombat(command));
  };
}

export const createCombatHandler = createCreateCombatHandler();
