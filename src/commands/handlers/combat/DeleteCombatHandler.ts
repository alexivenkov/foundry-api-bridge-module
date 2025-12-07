import type { CombatIdParams, DeleteResult } from '@/commands/types';
import { getActiveCombat, type FoundryGame } from './combatTypes';

declare const game: FoundryGame;

export async function deleteCombatHandler(params: CombatIdParams): Promise<DeleteResult> {
  const combat = getActiveCombat(game, params.combatId);

  await combat.delete();

  return { deleted: true };
}