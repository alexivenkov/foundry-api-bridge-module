import type { RollAllInitiativeParams, InitiativeRollResult } from '@/commands/types';
import {
  getActiveCombat,
  type FoundryGame,
  type RollInitiativeOptions
} from './combatTypes';

declare const game: FoundryGame;

export async function rollAllInitiativeHandler(params: RollAllInitiativeParams): Promise<InitiativeRollResult> {
  const combat = getActiveCombat(game, params.combatId);

  if (combat.combatants.contents.length === 0) {
    return { results: [] };
  }

  const options: RollInitiativeOptions = {};
  if (params.formula !== undefined) {
    options.formula = params.formula;
  }

  if (params.npcsOnly) {
    await combat.rollNPC(options);
  } else {
    await combat.rollAll(options);
  }

  // Collect results for all combatants with initiative
  const results = combat.combatants.contents
    .filter(c => c.initiative !== null)
    .map(combatant => ({
      combatantId: combatant.id,
      name: combatant.name,
      initiative: combatant.initiative ?? 0
    }));

  return { results };
}