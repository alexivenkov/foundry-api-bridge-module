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

  // Foundry returns undefined for idempotent no-op updates.
  // Fall back to the existing combatant reference in that case.
  const updated = await combatant.update({ defeated: params.defeated });
  return mapCombatantToResult(updated ?? combatant);
}