/**
 * The Sanity loss rules of `CoC7SanCheckCard` as pure functions: which
 * formula applies, the per-reason cap and Mythos hardening, and what the new
 * values trigger (`setSan`: Temporary Insanity at 5+ in one go, Indefinite
 * Insanity at the daily limit; `applySanLoss`: permanent at 0 SAN).
 */

export interface SanityLossFormulaInput {
  readonly isSuccess: boolean | null;
  readonly isFumble: boolean;
  readonly lossPassed: string | number;
  readonly lossFailed: string | number;
}

export interface SanityLossFormula {
  readonly formula: string;
  /** A fumble takes the maximum of the failed loss. */
  readonly maximize: boolean;
}

export function sanityLossFormula(input: SanityLossFormulaInput): SanityLossFormula {
  if (input.isFumble) {
    return { formula: String(input.lossFailed), maximize: true };
  }
  if (input.isSuccess === true) {
    return { formula: String(input.lossPassed), maximize: false };
  }
  return { formula: String(input.lossFailed), maximize: false };
}

export interface SanityLossCapInput {
  readonly rolled: number;
  /** `maxLossToSanReason(reason, lossFailed)` when a reason was given. */
  readonly reasonCap: number | undefined;
  readonly mythosHardened: boolean;
}

export interface SanityLossCapOutcome {
  readonly loss: number;
  readonly limitedByReason: boolean;
}

export function capSanityLoss(input: SanityLossCapInput): SanityLossCapOutcome {
  let loss = Math.max(0, input.rolled);
  let limitedByReason = false;
  if (input.reasonCap !== undefined && loss > input.reasonCap) {
    loss = input.reasonCap;
    limitedByReason = true;
  }
  if (input.mythosHardened) {
    loss = Math.floor(loss / 2);
  }
  return { loss, limitedByReason };
}

export const TEMPORARY_INSANITY_LOSS = 5;

export interface SanityAfterLossInput {
  readonly san: number;
  readonly sanMax: number;
  readonly dailyLoss: number;
  readonly dailyLimit: number;
  readonly loss: number;
}

export interface SanityAfterLossOutcome {
  readonly sanAfter: number;
  readonly dailyLossAfter: number;
  readonly temporaryInsanity: boolean;
  /** The system compares even when the limit is 0 (which would trigger on any loss); the module guards. */
  readonly indefiniteInsanity: boolean;
  readonly permanentInsanity: boolean;
}

export function sanityAfterLoss(input: SanityAfterLossInput): SanityAfterLossOutcome {
  const sanAfter = Math.min(input.sanMax, Math.max(0, input.san - input.loss));
  const dailyLossAfter = input.dailyLoss + input.loss;
  return {
    sanAfter,
    dailyLossAfter,
    temporaryInsanity: input.loss >= TEMPORARY_INSANITY_LOSS,
    indefiniteInsanity: input.loss > 0 && input.dailyLimit > 0 && dailyLossAfter >= input.dailyLimit,
    permanentInsanity: input.loss > 0 && sanAfter <= 0
  };
}
