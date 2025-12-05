import type { UpdateCombatantParams, CombatantResult } from '@/commands/types';
import {
  getActiveCombat,
  getCombatant,
  mapCombatantToResult,
  type FoundryGame,
  type CombatantUpdateData
} from './combatTypes';

declare const game: FoundryGame;

export async function updateCombatantHandler(params: UpdateCombatantParams): Promise<CombatantResult> {
  const combat = getActiveCombat(game, params.combatId);
  const combatant = getCombatant(combat, params.combatantId);

  const updateData: CombatantUpdateData = {};

  if (params.initiative !== undefined) {
    updateData.initiative = params.initiative;
  }
  if (params.defeated !== undefined) {
    updateData.defeated = params.defeated;
  }
  if (params.hidden !== undefined) {
    updateData.hidden = params.hidden;
  }

  if (Object.keys(updateData).length === 0) {
    return mapCombatantToResult(combatant);
  }

  const updated = await combatant.update(updateData);
  return mapCombatantToResult(updated);
}