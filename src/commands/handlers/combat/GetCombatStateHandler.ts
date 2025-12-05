import type { CombatIdParams, CombatResult } from '@/commands/types';
import { getActiveCombat, mapCombatToResult, type FoundryGame } from './combatTypes';

declare const game: FoundryGame;

export function getCombatStateHandler(params: CombatIdParams): Promise<CombatResult> {
  try {
    const combat = getActiveCombat(game, params.combatId);
    return Promise.resolve(mapCombatToResult(combat));
  } catch (error) {
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  }
}