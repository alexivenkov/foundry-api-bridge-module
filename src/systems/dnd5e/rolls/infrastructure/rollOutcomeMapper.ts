import type { DiceOutcome, RollOutcome } from '@/systems/shared/domain';
import type { FoundryD20Roll, FoundryDiceTerm } from './foundryRollTypes';

function extractDice(terms: FoundryDiceTerm[]): DiceOutcome[] {
  const dice: DiceOutcome[] = [];
  for (const term of terms) {
    if (term.faces !== undefined && term.results !== undefined) {
      dice.push({
        type: `d${String(term.faces)}`,
        count: term.number ?? 1,
        results: term.results.map((r) => r.result)
      });
    }
  }
  return dice;
}

export function toRollOutcome(roll: FoundryD20Roll): RollOutcome {
  const outcome: {
    total: number;
    formula: string;
    dice: DiceOutcome[];
    isCritical?: boolean;
    isFumble?: boolean;
  } = {
    total: roll.total,
    formula: roll.formula,
    dice: extractDice(roll.terms)
  };

  if (roll.isCritical) {
    outcome.isCritical = true;
  }
  if (roll.isFumble) {
    outcome.isFumble = true;
  }

  return outcome;
}
