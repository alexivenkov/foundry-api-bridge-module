import type { RemoveCombatantParams, DeleteResult } from '@/commands/types';
import { getActiveCombat, type FoundryGame } from './combatTypes';

declare const game: FoundryGame;

export async function removeCombatantHandler(params: RemoveCombatantParams): Promise<DeleteResult> {
  const combat = getActiveCombat(game, params.combatId);

  const combatant = combat.combatants.get(params.combatantId);
  if (!combatant) {
    throw new Error(`Combatant not found: ${params.combatantId}`);
  }

  await combat.deleteEmbeddedDocuments('Combatant', [params.combatantId]);

  return { deleted: true };
}