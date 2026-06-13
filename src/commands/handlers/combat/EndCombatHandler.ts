import type { CombatIdParams, DeleteResult } from '@/commands/types';
import { getActiveCombat, type FoundryGame } from './combatTypes';

declare const game: FoundryGame;

export async function endCombatHandler(params: CombatIdParams): Promise<DeleteResult> {
  const combat = getActiveCombat(game, params.combatId);

  // Use combat.delete() directly — combat.endCombat() shows a confirmation
  // dialog in Foundry UI that blocks programmatic workflows. Foundry's own
  // endCombat() is a Dialog.confirm wrapper around this.delete().
  await combat.delete();

  return { deleted: true };
}