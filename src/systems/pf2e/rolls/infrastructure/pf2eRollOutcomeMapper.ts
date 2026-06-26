import type { DiceOutcome, RollOutcome } from '@/systems/shared/domain';
import type { FoundryCheckRoll, FoundryPf2eDie } from './foundryPf2eRollTypes';

const DEGREE_CRITICAL_SUCCESS = 3;
const DEGREE_CRITICAL_FAILURE = 0;

function extractDice(dice: FoundryPf2eDie[]): DiceOutcome[] {
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

/**
 * Map a rolled PF2e `CheckRoll` to the neutral RollOutcome. PF2e's degree of
 * success collapses onto the system-neutral critical/fumble flags:
 * critical success → isCritical, critical failure → isFumble.
 */
export function toRollOutcome(roll: FoundryCheckRoll): RollOutcome {
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
