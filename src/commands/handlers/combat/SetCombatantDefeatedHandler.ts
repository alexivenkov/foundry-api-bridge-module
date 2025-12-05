import type { SetCombatantDefeatedParams, CombatantResult } from '@/commands/types';
import {
  getActiveCombat,
  getCombatant,
  mapCombatantToResult,
  type FoundryGame
} from './combatTypes';

declare const game: FoundryGame;

export async function setCombatantDefeatedHandler(params: SetCombatantDefeatedParams): Promise<CombatantResult> {
  const combat = getActiveCombat(game, params.combatId);
  const combatant = getCombatant(combat, params.combatantId);

  const updated = await combatant.update({ defeated: params.defeated });
  return mapCombatantToResult(updated);
}