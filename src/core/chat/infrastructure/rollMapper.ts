import type { DiceRoll, RolledDice } from '@/core/chat/domain';
import type { FoundryRoll } from './foundryRollTypes';

export function toDiceRoll(roll: FoundryRoll): DiceRoll {
  const dice: RolledDice[] = [];

  for (const term of roll.terms) {
    if (term.faces !== undefined && term.results !== undefined) {
      dice.push({
        faces: term.faces,
        count: term.number ?? 1,
        results: term.results.map((die) => ({ value: die.result, kept: die.active !== false }))
      });
    }
  }

  return { formula: roll.formula, total: roll.total, dice };
}

/** Before evaluation a dice term's count is a number, or still an unresolved expression. */
export function readDiceCounts(roll: FoundryRoll): (number | null)[] {
  return (roll.dice ?? []).map((term) => {
    const count = term.number;
    return typeof count === 'number' && Number.isFinite(count) ? count : null;
  });
}
