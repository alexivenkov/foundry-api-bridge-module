import type { AddCombatantParams, CombatantResult } from '@/commands/types';
import {
  getActiveCombat,
  mapCombatantToResult,
  type FoundryGame,
  type FoundryCombatantCreateData
} from './combatTypes';

declare const game: FoundryGame;

export async function addCombatantHandler(params: AddCombatantParams): Promise<CombatantResult> {
  const combat = getActiveCombat(game, params.combatId);

  const combatantData: FoundryCombatantCreateData = {
    actorId: params.actorId
  };

  if (params.tokenId !== undefined) {
    combatantData.tokenId = params.tokenId;
  }

  if (params.initiative !== undefined) {
    combatantData.initiative = params.initiative;
  }

  if (params.hidden !== undefined) {
    combatantData.hidden = params.hidden;
  }

  const combatants = await combat.createEmbeddedDocuments('Combatant', [combatantData]);

  const createdCombatant = combatants[0];

  if (!createdCombatant) {
    throw new Error('Failed to create combatant');
  }

  return mapCombatantToResult(createdCombatant);
}