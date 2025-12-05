import type { CombatIdParams, CombatResult } from '@/commands/types';
import { getActiveCombat, mapCombatToResult, type FoundryGame } from './combatTypes';

declare const game: FoundryGame;

export async function nextTurnHandler(params: CombatIdParams): Promise<CombatResult> {
  const combat = getActiveCombat(game, params.combatId);

  if (!combat.started) {
    throw new Error('Combat not started');
  }

  const updatedCombat = await combat.nextTurn();

  return mapCombatToResult(updatedCombat);
}