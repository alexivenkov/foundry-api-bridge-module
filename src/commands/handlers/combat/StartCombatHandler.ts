import type { CombatIdParams, CombatResult } from '@/commands/types';
import { getActiveCombat, mapCombatToResult, type FoundryGame } from './combatTypes';

declare const game: FoundryGame;

export async function startCombatHandler(params: CombatIdParams): Promise<CombatResult> {
  const combat = getActiveCombat(game, params.combatId);

  if (combat.started) {
    throw new Error('Combat already started');
  }

  const updatedCombat = await combat.startCombat();

  return mapCombatToResult(updatedCombat);
}