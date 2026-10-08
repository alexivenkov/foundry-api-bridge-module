import type { DiceOutcome, RollMode, RollOutcome } from '@/systems/shared/domain';
import { keptD20Of, rollModeOf } from '@/systems/shared/domain';
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
    mode?: RollMode;
    kept?: number;
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
  // Reported together: a system that says which mode applied also says which die stayed.
  const mode = rollModeOf(roll);
  const kept = keptD20Of(roll);
  if (mode !== undefined && kept !== undefined) {
    outcome.mode = mode;
    outcome.kept = kept;
  }

  return outcome;
}
