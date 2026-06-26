import type { DiceOutcome, RollOutcome } from '@/systems/shared/domain';
import type {
  FoundryCheckRoll,
  FoundryDamageRoll,
  FoundryStrikeDie
} from './foundryPf2eStrikeTypes';

const DEGREE_CRITICAL_SUCCESS = 3;
const DEGREE_CRITICAL_FAILURE = 0;

function extractDice(dice: FoundryStrikeDie[]): DiceOutcome[] {
  const result: DiceOutcome[] = [];
  for (const die of dice) {
    if (die.faces !== undefined && die.results !== undefined) {
      result.push({
        type: `d${String(die.faces)}`,
        count: die.number ?? 1,
        results: die.results.map((r) => r.result)
      });
    }
  }
  return result;
}

/** Map a strike attack `CheckRoll`; degree of success collapses onto crit/fumble. */
export function checkToRollOutcome(roll: FoundryCheckRoll): RollOutcome {
  const outcome: {
    total: number;
    formula: string;
    dice: DiceOutcome[];
    isCritical?: boolean;
    isFumble?: boolean;
  } = {
    total: roll.total,
    formula: roll.formula,
    dice: extractDice(roll.dice)
  };

  if (roll.degreeOfSuccess === DEGREE_CRITICAL_SUCCESS) {
    outcome.isCritical = true;
  }
  if (roll.degreeOfSuccess === DEGREE_CRITICAL_FAILURE) {
    outcome.isFumble = true;
  }

  return outcome;
}

/** Map a strike `DamageRoll`. Damage has no degree of success, so no crit/fumble flags. */
export function damageToRollOutcome(roll: FoundryDamageRoll): RollOutcome {
  return {
    total: roll.total,
    formula: roll.formula,
    dice: extractDice(roll.dice)
  };
}
