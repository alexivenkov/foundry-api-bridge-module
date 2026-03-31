import type { SetTurnParams, CombatResult } from '@/commands/types';
import { getActiveCombat, mapCombatToResult, type FoundryGame } from './combatTypes';

declare const game: FoundryGame;

export async function setTurnHandler(params: SetTurnParams): Promise<CombatResult> {
  const combat = getActiveCombat(game, params.combatId);

  if (!combat.started) {
    throw new Error('Combat not started');
  }

  const turnIndex = combat.turns.findIndex(t => t.id === params.combatantId);

  if (turnIndex === -1) {
    throw new Error(`Combatant not found in turn order: ${params.combatantId}`);
  }

  await combat.update({ turn: turnIndex });

  return mapCombatToResult(combat);
}
