import type {
  SwadeDieOutcome,
  SwadeRollModifierOutcome,
  SwadeTraitOutcomeKind,
  SwadeTraitRollOutcome
} from '@/systems/swade/shared/domain';
import {
  isPoolTerm,
  type FoundryDieTerm,
  type FoundryRollTerm,
  type FoundrySwadeDamageRoll,
  type FoundrySwadeTraitRoll
} from './foundrySwadeTypes';

const CRITICAL_FAILURE = -1;
const SUCCESS = 1;

/** `game.swade.dice.WildDie` when the system is loaded; identification falls back to the `dw` denomination. */
export function isWildDie(die: FoundryDieTerm, wildDieClass: unknown): boolean {
  if (typeof wildDieClass === 'function' && die instanceof wildDieClass) {
    return true;
  }
  return typeof die.denomination === 'string' && die.denomination.startsWith('dw');
}

function dieType(die: FoundryDieTerm): string {
  return `d${String(die.faces ?? 0)}`;
}

function dieTotal(die: FoundryDieTerm): number {
  return die.total ?? die.results.reduce((sum, r) => sum + r.result, 0);
}

/** Every die of the trait-roll pool, explosions included; `kept` marks the die `kh` kept. */
export function extractPoolDice(roll: FoundrySwadeTraitRoll, wildDieClass: unknown): SwadeDieOutcome[] {
  const head = roll.terms[0];
  if (!isPoolTerm(head)) {
    return roll.dice.map((die) => ({
      type: dieType(die),
      results: die.results.map((r) => r.result),
      total: dieTotal(die),
      wild: isWildDie(die, wildDieClass),
      kept: true
    }));
  }
  return head.rolls.map((poolRoll, index) => {
    const die = poolRoll.dice[0];
    const results = die ? die.results.map((r) => r.result) : [];
    return {
      type: die ? dieType(die) : 'd0',
      results,
      total: poolRoll.total ?? (die ? dieTotal(die) : 0),
      wild: die ? isWildDie(die, wildDieClass) : false,
      kept: head.results[index]?.discarded !== true
    };
  });
}

/** The modifier terms the system appended after the pool: `+2[Modifier] -1[Wounds] +1d6x[Conviction]`. */
export function extractModifiers(roll: FoundrySwadeTraitRoll | FoundrySwadeDamageRoll, skip: number): SwadeRollModifierOutcome[] {
  const modifiers: SwadeRollModifierOutcome[] = [];
  let sign = 1;
  for (const term of roll.terms.slice(skip)) {
    if (term.operator !== undefined) {
      sign = term.operator.trim() === '-' ? -1 : 1;
      continue;
    }
    const value = sign * (term.total ?? 0);
    modifiers.push({ label: labelOf(term), value });
    sign = 1;
  }
  return modifiers;
}

function labelOf(term: FoundryRollTerm): string {
  if (term.flavor !== undefined && term.flavor !== '') {
    return term.flavor;
  }
  if (term.expression !== undefined && term.expression !== '') {
    return term.expression;
  }
  return 'Modifier';
}

function outcomeOf(successes: number): SwadeTraitOutcomeKind {
  if (successes <= CRITICAL_FAILURE) return 'critical-failure';
  if (successes < SUCCESS) return 'failure';
  if (successes === SUCCESS) return 'success';
  return 'raise';
}

export interface TraitRollContext {
  readonly actorId: string;
  readonly tokenId?: string;
  readonly trait: string;
  readonly wildDieClass: unknown;
}

/** Map an evaluated swade `TraitRoll` to the outcome: dice, modifiers, successes and raises against its target number. */
export function toTraitRollOutcome(roll: FoundrySwadeTraitRoll, context: TraitRollContext): SwadeTraitRollOutcome {
  const dice = extractPoolDice(roll, context.wildDieClass);
  const total = roll.total ?? 0;
  const kept = dice.find((die) => die.kept);
  const keptTotal = kept?.total ?? 0;
  const successes = roll.successes;
  const isCriticalFailure = roll.isCritfail === true || successes <= CRITICAL_FAILURE;
  const raises = Math.max(0, successes - SUCCESS);

  const outcome: {
    actorId: string;
    tokenId?: string;
    trait: string;
    total: number;
    formula: string;
    dice: SwadeDieOutcome[];
    modifiers: SwadeRollModifierOutcome[];
    modifierTotal: number;
    targetNumber: number;
    successes: number;
    outcome: SwadeTraitOutcomeKind;
    raises: number;
    isCriticalFailure: boolean;
    wildDie: boolean;
    isCritical: boolean;
    isFumble: boolean;
  } = {
    actorId: context.actorId,
    trait: context.trait,
    total,
    formula: roll.formula,
    dice,
    modifiers: extractModifiers(roll, 1),
    modifierTotal: total - keptTotal,
    targetNumber: roll.targetNumber,
    successes,
    outcome: isCriticalFailure ? 'critical-failure' : outcomeOf(successes),
    raises,
    isCriticalFailure,
    wildDie: dice.some((die) => die.wild),
    isCritical: raises > 0,
    isFumble: isCriticalFailure
  };
  if (context.tokenId !== undefined) {
    outcome.tokenId = context.tokenId;
  }
  return outcome;
}

/** Dice of an evaluated swade `DamageRoll`: base damage, raise dice and any modifier dice. */
export function extractDamageDice(roll: FoundrySwadeDamageRoll): SwadeDieOutcome[] {
  return roll.dice.map((die) => ({
    type: dieType(die),
    results: die.results.map((r) => r.result),
    total: dieTotal(die),
    wild: false,
    kept: true
  }));
}
