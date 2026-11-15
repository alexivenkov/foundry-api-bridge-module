import {
  RollFormulaRequiredError,
  RollFormulaTooLongError,
  TooManyDiceError,
  TooManySimulatedDiceError
} from '@/core/chat/domain/errors/diceErrors';
import type { RolledDice } from '@/core/chat/domain/model/DiceRoll';

// Guards against formulas that would freeze the GM's browser: the core
// evaluates every die synchronously on the main thread, and a single
// "10000d20" is enough to stall the UI for seconds.
export const MAX_FORMULA_LENGTH = 200;
export const MAX_DICE = 1000;

/** The formula as it will be rolled: trimmed, not empty and short enough to parse safely. */
export function parseRollFormula(raw: string): string {
  const formula = raw.trim();
  if (formula === '') {
    throw new RollFormulaRequiredError();
  }
  if (formula.length > MAX_FORMULA_LENGTH) {
    throw new RollFormulaTooLongError(formula.length, MAX_FORMULA_LENGTH);
  }
  return formula;
}

/** A dice term whose count is itself an expression (`(1d4)d6`) counts as one die. */
export function countRequestedDice(counts: readonly (number | null)[]): number {
  return counts.reduce<number>((sum, count) => sum + (count ?? 1), 0);
}

export function assertDiceBudget(counts: readonly (number | null)[]): void {
  const requested = countRequestedDice(counts);
  if (requested > MAX_DICE) {
    throw new TooManyDiceError(requested, MAX_DICE);
  }
}

/** Why a formula the core turns down is not valid; the core gives no reason of its own. */
export const UNEVALUABLE_FORMULA = 'Foundry cannot parse or evaluate the formula';

// A simulation rolls every iteration in one go on the GM's main thread, so its
// dice count against one budget for the whole run.
export const DEFAULT_SIMULATIONS = 100;
export const MAX_SIMULATIONS = 1000;
export const MAX_SIMULATED_DICE = 100_000;

export function assertSimulationBudget(counts: readonly (number | null)[], iterations: number): void {
  const requested = countRequestedDice(counts) * iterations;
  if (requested > MAX_SIMULATED_DICE) {
    throw new TooManySimulatedDiceError(requested, MAX_SIMULATED_DICE);
  }
}

export interface RollTotalsSummary {
  readonly min: number;
  readonly max: number;
  /** Rounded to two decimals. */
  readonly mean: number;
}

/** All zero for no totals. */
export function summarizeTotals(totals: readonly number[]): RollTotalsSummary {
  if (totals.length === 0) {
    return { min: 0, max: 0, mean: 0 };
  }
  const sum = totals.reduce((acc, total) => acc + total, 0);
  return {
    min: Math.min(...totals),
    max: Math.max(...totals),
    mean: Math.round((sum / totals.length) * 100) / 100
  };
}

export interface NaturalExtremes {
  /** A kept d20 shows 20. */
  readonly isCritical: boolean;
  /** A kept d20 shows 1. */
  readonly isFumble: boolean;
}

/** Only d20s that were kept count: the discarded die of advantage or disadvantage does not. */
export function readNaturalExtremes(dice: readonly RolledDice[]): NaturalExtremes {
  const keptD20s = dice
    .filter((term) => term.faces === 20)
    .flatMap((term) => term.results.filter((die) => die.kept).map((die) => die.value));

  return { isCritical: keptD20s.includes(20), isFumble: keptD20s.includes(1) };
}
