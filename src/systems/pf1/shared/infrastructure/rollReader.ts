import { RollResolutionError } from '@/systems/shared/domain/errors';
import type { Pf1D20RollOutcome, Pf1DieOutcome, Pf1RollOutcome } from '@/systems/pf1/shared/domain';
import type { FoundryPf1RollResult, FoundryRollData, FoundryRollLike, FoundryRollTermData } from './foundryPf1Types';

export const ROLL_CANCELLED = 'Roll was cancelled (a module hook or the permission check refused it)';

/**
 * Normalize a roll to its serialized form. The system hands back live `Roll`
 * instances on a created ChatMessage and JSON strings on the message data it
 * answers with `chatMessage: false`; reading both through `toJSON()` keeps a
 * single code path.
 */
export function toRollData(roll: FoundryRollLike): FoundryRollData {
  if (typeof roll === 'string') {
    try {
      return JSON.parse(roll) as FoundryRollData;
    } catch {
      throw new RollResolutionError('The system answered an unreadable roll');
    }
  }
  if ('toJSON' in roll && typeof roll.toJSON === 'function') {
    return roll.toJSON();
  }
  return roll as FoundryRollData;
}

function keptResults(term: FoundryRollTermData): number[] {
  return (term.results ?? []).filter((r) => r.active !== false && r.discarded !== true).map((r) => r.result);
}

/**
 * Every die of the roll, including dice nested in function and parenthetical
 * terms: pf1 writes weapon damage as `sizeRoll(1, 8, 4)`, whose `1d8` lives in
 * the FunctionTerm's `rolls`, not among the top-level terms.
 */
function diceOf(data: FoundryRollData): Pf1DieOutcome[] {
  const dice: Pf1DieOutcome[] = [];
  for (const term of data.terms ?? []) {
    if (typeof term.faces === 'number' && Array.isArray(term.results)) {
      dice.push({ type: `d${String(term.faces)}`, count: term.number ?? term.results.length, results: keptResults(term) });
    }
    for (const nested of [...(term.rolls ?? []), ...(term.roll ? [term.roll] : [])]) {
      dice.push(...diceOf(nested));
    }
  }
  return dice;
}

export function toRollOutcome(data: FoundryRollData): Pf1RollOutcome {
  return { total: data.total ?? 0, formula: data.formula ?? '', dice: diceOf(data) };
}

/**
 * `D20RollPF.natural` is the total of its first term: the d20 die (Take 10/20
 * is spoofed as a manual d20 result, `staticRoll` set) or a number term.
 */
export function toD20RollOutcome(data: FoundryRollData): Pf1D20RollOutcome {
  const head = data.terms?.[0];
  let natural: number | null = null;
  if (head?.results !== undefined) {
    const kept = keptResults(head);
    natural = kept.length > 0 ? kept.reduce((sum, r) => sum + r, 0) : null;
  } else if (typeof head?.number === 'number') {
    natural = head.number;
  }
  return {
    ...toRollOutcome(data),
    natural,
    isStatic: typeof data.options?.staticRoll === 'number'
  };
}

/** The first roll of what `pf1.dice.d20Roll` answered, plus the message id when one was created. */
export function readD20Result(result: FoundryPf1RollResult | undefined | null): {
  roll: FoundryRollData;
  messageId?: string;
} {
  if (!result) {
    throw new RollResolutionError(ROLL_CANCELLED);
  }
  const first = result.rolls?.[0];
  if (first === undefined) {
    throw new RollResolutionError('The system answered no roll');
  }
  const roll = toRollData(first);
  return typeof result.id === 'string' ? { roll, messageId: result.id } : { roll };
}
