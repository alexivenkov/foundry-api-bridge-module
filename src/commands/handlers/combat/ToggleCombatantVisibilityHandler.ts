import type { ToggleCombatantVisibilityParams, CombatantResult } from '@/commands/types';
import {
  getActiveCombat,
  getCombatant,
  mapCombatantToResult,
  type FoundryGame
} from './combatTypes';

declare const game: FoundryGame;

export async function toggleCombatantVisibilityHandler(params: ToggleCombatantVisibilityParams): Promise<CombatantResult> {
  const combat = getActiveCombat(game, params.combatId);
  const combatant = getCombatant(combat, params.combatantId);

  const updated = await combatant.update({ hidden: !combatant.hidden });
  return mapCombatantToResult(updated);
}