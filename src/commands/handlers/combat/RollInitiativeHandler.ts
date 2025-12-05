import type { RollInitiativeParams, InitiativeRollResult } from '@/commands/types';
import {
  getActiveCombat,
  type FoundryGame,
  type RollInitiativeOptions
} from './combatTypes';

declare const game: FoundryGame;

export async function rollInitiativeHandler(params: RollInitiativeParams): Promise<InitiativeRollResult> {
  const combat = getActiveCombat(game, params.combatId);

  if (params.combatantIds.length === 0) {
    throw new Error('No combatant IDs provided');
  }

  // Verify all combatants exist
  for (const id of params.combatantIds) {
    const combatant = combat.combatants.get(id);
    if (!combatant) {
      throw new Error(`Combatant not found: ${id}`);
    }
  }

  const options: RollInitiativeOptions = {};
  if (params.formula !== undefined) {
    options.formula = params.formula;
  }

  await combat.rollInitiative(params.combatantIds, options);

  // Collect results
  const results = params.combatantIds.map(id => {
    const combatant = combat.combatants.get(id);
    return {
      combatantId: id,
      name: combatant?.name ?? 'Unknown',
      initiative: combatant?.initiative ?? 0
    };
  });

  return { results };
}