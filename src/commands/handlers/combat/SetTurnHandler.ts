import type { CombatResult, SetTurnParams } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  combatantAddressRequestSchema,
  createFoundryCombatService,
  toSetTurnCommand,
  type CombatWiring
} from '@/core/combat';
import { toWireCombat } from './combatWireMappers';

export function createSetTurnHandler(
  wiring: CombatWiring = {}
): (params: SetTurnParams) => Promise<CombatResult> {
  const service = createFoundryCombatService(wiring);

  return async function setTurnHandler(params: SetTurnParams): Promise<CombatResult> {
    const command = toSetTurnCommand(parseRequest(combatantAddressRequestSchema, params));
    return toWireCombat(await service.setTurn(command));
  };
}

export const setTurnHandler = createSetTurnHandler();
