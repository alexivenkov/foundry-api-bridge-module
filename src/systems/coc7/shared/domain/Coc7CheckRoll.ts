import { ValidationError } from '@/systems/shared/domain/errors';
import { COC7_DIFFICULTY_LEVEL, type Coc7Difficulty } from './Coc7Difficulty';

/** `CoC7DicePool.successLevel`. */
export const COC7_SUCCESS_LEVEL = {
  fumble: -99,
  failure: 0,
  regular: 1,
  hard: 2,
  extreme: 3,
  critical: 4
} as const;

export type Coc7SuccessLevelName = keyof typeof COC7_SUCCESS_LEVEL;

export const COC7_MAX_POOL_DICE = 2;

export interface Coc7CheckInput {
  /** The value rolled against, before `flatThresholdModifier`. */
  readonly threshold: number;
  readonly difficulty: Coc7Difficulty;
  readonly bonusDice: number;
  readonly penaltyDice: number;
  readonly flatDiceModifier: number;
  readonly flatThresholdModifier: number;
}

/** The d10 faces Foundry rolled: 1–10, where 10 is the 0 / "00" face. */
export interface Coc7RolledDice {
  readonly tens: readonly number[];
  readonly unit: number;
}

export interface Coc7Range {
  readonly min: number;
  readonly max: number;
}

export interface Coc7Ranges {
  readonly fumbleFrom: number;
  readonly critical: Coc7Range;
  readonly extreme?: Coc7Range;
  readonly hard?: Coc7Range;
  readonly regular?: Coc7Range;
  readonly failure?: Coc7Range;
  readonly fumble: Coc7Range;
}

export interface Coc7TensDieOutcome {
  /** 0, 10, … 90 (0 = the 00 face). */
  readonly value: number;
  readonly kept: boolean;
}

export interface Coc7Thresholds {
  readonly regular: number;
  readonly hard: number;
  readonly extreme: number;
  readonly fumbleFrom: number;
}

export interface Coc7LuckRequired {
  readonly regular: number;
  readonly hard: number;
  readonly extreme: number;
}

export interface Coc7CheckDiceOutcome {
  readonly tens: readonly Coc7TensDieOutcome[];
  readonly unit: number;
  readonly bonusDice: number;
  readonly penaltyDice: number;
}

export interface Coc7CheckResolution {
  readonly threshold: number;
  readonly difficulty: Coc7Difficulty;
  readonly thresholds: Coc7Thresholds;
  readonly dice: Coc7CheckDiceOutcome;
  readonly total: number;
  readonly successLevel: number;
  readonly outcome: Coc7SuccessLevelName;
  readonly isSuccess: boolean | null;
  readonly isCritical: boolean;
  readonly isFumble: boolean;
  readonly luckRequired: Coc7LuckRequired;
  /** A success rolled without bonus or penalty dice: the development tick condition. */
  readonly isRolledSuccess: boolean;
}

export const BONUS_AND_PENALTY_EXCLUSIVE = 'bonusDice and penaltyDice are exclusive';

function fumbleFrom(regular: number, difficulty: Coc7Difficulty): number {
  switch (difficulty) {
    case 'regular':
      return regular < 50 ? 96 : 100;
    case 'hard':
      return Math.floor(regular / 2) < 50 ? 96 : 100;
    case 'extreme':
      return Math.floor(regular / 5) < 50 ? 96 : 100;
    default:
      return 100;
  }
}

/** `CoC7DicePool#populateThresholdRanges` for a known threshold. */
export function computeCoc7Ranges(threshold: number, flatThresholdModifier: number, difficulty: Coc7Difficulty): Coc7Ranges {
  const regular = threshold + flatThresholdModifier;
  const fumble = fumbleFrom(regular, difficulty);
  const bounds: Partial<Record<'extreme' | 'hard' | 'regular', number>> = {};
  let minimum = 1;
  let maximum = fumble - 1;
  const checks: ReadonlyArray<['extreme' | 'hard' | 'regular', number]> = [
    ['extreme', Math.floor(regular / 5)],
    ['hard', Math.floor(regular / 2)],
    ['regular', regular]
  ];
  for (const [key, bound] of checks) {
    if (bound > minimum && maximum > 0) {
      minimum = bound;
      bounds[key] = Math.min(bound, maximum);
      if (bounds[key] === maximum) {
        maximum = 0;
      }
    }
  }

  let next = 2;
  const ranges: {
    fumbleFrom: number;
    critical: Coc7Range;
    extreme?: Coc7Range;
    hard?: Coc7Range;
    regular?: Coc7Range;
    failure?: Coc7Range;
    fumble: Coc7Range;
  } = { fumbleFrom: fumble, critical: { min: 1, max: 1 }, fumble: { min: fumble, max: 100 } };
  for (const key of ['extreme', 'hard', 'regular'] as const) {
    const bound = bounds[key];
    if (bound !== undefined) {
      ranges[key] = { min: next, max: bound };
      next = bound + 1;
    }
  }
  if (next <= fumble - 1) {
    ranges.failure = { min: next, max: fumble - 1 };
  }
  return ranges;
}

function inRange(range: Coc7Range | undefined, value: number): boolean {
  return range !== undefined && value >= range.min && value <= range.max;
}

function levelOf(ranges: Coc7Ranges, total: number): Coc7SuccessLevelName {
  if (inRange(ranges.critical, total)) return 'critical';
  if (inRange(ranges.extreme, total)) return 'extreme';
  if (inRange(ranges.hard, total)) return 'hard';
  if (inRange(ranges.regular, total)) return 'regular';
  if (inRange(ranges.failure, total)) return 'failure';
  return 'fumble';
}

function luckFor(range: Coc7Range | undefined, total: number): number {
  return range === undefined ? 0 : Math.max(0, total - range.max);
}

function faceValue(face: number): number {
  return face === 10 ? 0 : face;
}

/**
 * The d100 engine of `CoC7DicePool`, as a pure function over the rolled
 * faces: the tens candidates, the kept die (lowest with bonus dice, highest
 * with penalty dice), the flat modifier, the success-level ranges and the
 * Luck needed to reach each level.
 */
export function resolveCoc7Check(input: Coc7CheckInput, rolled: Coc7RolledDice): Coc7CheckResolution {
  if (input.bonusDice > 0 && input.penaltyDice > 0) {
    throw new ValidationError(BONUS_AND_PENALTY_EXCLUSIVE);
  }
  const expectedTens = 1 + input.bonusDice + input.penaltyDice;
  if (rolled.tens.length !== expectedTens) {
    throw new ValidationError(`Expected ${String(expectedTens)} tens dice, got ${String(rolled.tens.length)}`);
  }

  const unit = faceValue(rolled.unit);
  const tensValues = rolled.tens.map((face) => faceValue(face) * 10);
  const candidates = tensValues.map((tens) => (tens === 0 && unit === 0 ? 100 : tens + unit));
  const chosen =
    input.bonusDice > 0 ? Math.min(...candidates) : input.penaltyDice > 0 ? Math.max(...candidates) : (candidates[0] ?? 100);
  const keptIndex = candidates.indexOf(chosen);
  const total = Math.max(1, Math.min(100, chosen + input.flatDiceModifier));

  const ranges = computeCoc7Ranges(input.threshold, input.flatThresholdModifier, input.difficulty);
  const outcome = levelOf(ranges, total);
  const successLevel = COC7_SUCCESS_LEVEL[outcome];
  const difficultyLevel = COC7_DIFFICULTY_LEVEL[input.difficulty];
  const isSuccess = input.difficulty === 'unknown' ? null : successLevel >= difficultyLevel;

  return {
    threshold: input.threshold,
    difficulty: input.difficulty,
    thresholds: {
      regular: ranges.regular?.max ?? 0,
      hard: ranges.hard?.max ?? 0,
      extreme: ranges.extreme?.max ?? 0,
      fumbleFrom: ranges.fumbleFrom
    },
    dice: {
      tens: tensValues.map((value, index) => ({ value, kept: index === keptIndex })),
      unit,
      bonusDice: input.bonusDice,
      penaltyDice: input.penaltyDice
    },
    total,
    successLevel,
    outcome,
    isSuccess,
    isCritical: outcome === 'critical',
    isFumble: outcome === 'fumble',
    luckRequired: {
      regular: luckFor(ranges.regular, total),
      hard: luckFor(ranges.hard, total),
      extreme: luckFor(ranges.extreme, total)
    },
    isRolledSuccess: isSuccess === true && input.bonusDice === 0 && input.penaltyDice === 0
  };
}
