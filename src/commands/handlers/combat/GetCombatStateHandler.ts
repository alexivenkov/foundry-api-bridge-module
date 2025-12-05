import type { CombatIdParams, CombatResult } from '@/commands/types';
import { getActiveCombat, mapCombatToResult, type FoundryGame } from './combatTypes';

declare const game: FoundryGame;

export async function getCombatStateHandler(params: CombatIdParams): Promise<CombatResult> {
  const combat = getActiveCombat(game, params.combatId);

  return mapCombatToResult(combat);
}