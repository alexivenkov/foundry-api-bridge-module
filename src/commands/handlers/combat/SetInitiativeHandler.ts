import type { SetInitiativeParams, CombatantResult } from '@/commands/types';
import {
  getActiveCombat,
  mapCombatantToResult,
  type FoundryGame
} from './combatTypes';

declare const game: FoundryGame;

export async function setInitiativeHandler(params: SetInitiativeParams): Promise<CombatantResult> {
  const combat = getActiveCombat(game, params.combatId);

  const combatant = combat.combatants.get(params.combatantId);
  if (!combatant) {
    throw new Error(`Combatant not found: ${params.combatantId}`);
  }

  await combat.setInitiative(params.combatantId, params.initiative);

  // Get updated combatant
  const updatedCombatant = combat.combatants.get(params.combatantId);
  if (!updatedCombatant) {
    throw new Error('Failed to get updated combatant');
  }

  return mapCombatantToResult(updatedCombatant);
}