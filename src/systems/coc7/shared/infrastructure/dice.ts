import type { Coc7DieRollOutcome } from '@/systems/coc7/shared/domain';

export interface FoundryDieResultLike {
  result: number;
  active?: boolean;
}

export interface FoundryDieTermLike {
  faces?: number;
  number?: number;
  results: FoundryDieResultLike[];
  total?: number;
}

/** The slice of a Foundry `Roll` the coc7 dice roller reads; the instance itself is attached to chat cards. */
export interface FoundryRollLike {
  formula: string;
  total?: number;
  dice: FoundryDieTermLike[];
  evaluate(options?: { maximize?: boolean; minimize?: boolean; allowInteractive?: boolean }): Promise<unknown>;
  toMessage(messageData?: Record<string, unknown>): Promise<{ id?: string | null } | null | undefined>;
}

interface FoundryRollConstructor {
  new (formula: string, data?: Record<string, unknown>): FoundryRollLike;
}

export interface Coc7D10Roll {
  /** Faces 1–10 as rolled (10 is the 0 / "00" face). */
  readonly results: readonly number[];
  readonly roll: FoundryRollLike;
}

export interface Coc7FormulaRoll {
  readonly formula: string;
  readonly total: number;
  readonly dice: readonly Coc7DieRollOutcome[];
  readonly roll: FoundryRollLike;
}

/** Rolls go through Foundry's `Roll` so Dice So Nice animates them and the results stay auditable on the card. */
export interface Coc7DiceRoller {
  rollD10(count: number): Promise<Coc7D10Roll>;
  rollFormula(formula: string, data?: Record<string, unknown>, options?: { maximize?: boolean }): Promise<Coc7FormulaRoll>;
}

function rollClass(): FoundryRollConstructor {
  const cls = (globalThis as { Roll?: FoundryRollConstructor }).Roll;
  if (!cls) {
    throw new Error('Foundry Roll is not available');
  }
  return cls;
}

export function dieTermsOf(roll: FoundryRollLike): Coc7DieRollOutcome[] {
  return roll.dice.map((term) => {
    const results = term.results.filter((r) => r.active !== false).map((r) => r.result);
    return {
      formula: `${String(term.number ?? results.length)}d${String(term.faces ?? 0)}`,
      results,
      total: term.total ?? results.reduce((sum, r) => sum + r, 0)
    };
  });
}

export class FoundryCoc7DiceRoller implements Coc7DiceRoller {
  async rollD10(count: number): Promise<Coc7D10Roll> {
    const Roll = rollClass();
    const roll = new Roll(`${String(count)}d10`);
    await roll.evaluate({ allowInteractive: false });
    const results = roll.dice.flatMap((term) => term.results.map((r) => r.result));
    return { results, roll };
  }

  async rollFormula(formula: string, data: Record<string, unknown> = {}, options: { maximize?: boolean } = {}): Promise<Coc7FormulaRoll> {
    const Roll = rollClass();
    const roll = new Roll(formula, data);
    await roll.evaluate({ allowInteractive: false, ...(options.maximize === true ? { maximize: true } : {}) });
    return { formula: roll.formula, total: roll.total ?? 0, dice: dieTermsOf(roll), roll };
  }
}

/** A formula that is only a (signed) integer needs no roll. */
export function isPlainNumber(formula: string | number): boolean {
  return /^\s*[+-]?\d+\s*$/.test(String(formula));
}
