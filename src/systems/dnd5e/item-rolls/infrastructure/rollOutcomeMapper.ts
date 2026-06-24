import type { DiceOutcome, RollOutcome } from '@/systems/shared/domain';
import type { FoundryD20Roll, FoundryDamageRoll, FoundryDiceTerm } from './foundryItemRollTypes';

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

/**
 * Damage rolls carry no crit/fumble flags (FoundryDamageRoll has no such
 * fields). The `isCritical` of a damage result is decided by the caller's
 * `critical` flag, applied at the inbound-adapter boundary — not here.
 */
export function toDamageRollOutcome(roll: FoundryDamageRoll): RollOutcome {
  return {
    total: roll.total,
    formula: roll.formula,
    dice: extractDice(roll.terms)
  };
}
