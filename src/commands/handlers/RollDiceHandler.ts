import type { RollDiceParams, RollResult } from '@/commands/types';
import { extractDiceResults } from '@/commands/handlers/shared';
import type { FoundryDiceTerm } from '@/commands/handlers/shared';

interface FoundryRoll {
  evaluate(): Promise<FoundryRoll>;
  toMessage(options?: { flavor?: string }): Promise<unknown>;
  total: number;
  formula: string;
  terms: FoundryDiceTerm[];
  /** Parsed dice terms, available before evaluation. */
  dice?: Array<{ number?: unknown }>;
}

// Guards against formulas that would freeze the GM's browser: Foundry
// evaluates every die synchronously on the main thread, and a single
// "10000d20" is enough to stall the UI for seconds.
const MAX_FORMULA_LENGTH = 200;
const MAX_DICE = 1000;

function countDice(roll: FoundryRoll): number {
  return (roll.dice ?? []).reduce((sum, term) => {
    const n = term.number;
    return sum + (typeof n === 'number' && Number.isFinite(n) ? n : 1);
  }, 0);
}

interface RollConstructor {
  new (formula: string): FoundryRoll;
}

declare const Roll: RollConstructor;

function checkCritical(terms: FoundryDiceTerm[]): { isCritical: boolean; isFumble: boolean } {
  const activeD20Results = terms
    .filter(t => t.faces === 20 && t.results !== undefined)
    .flatMap(t => (t.results ?? []).filter(r => r.active !== false).map(r => r.result));

  return {
    isCritical: activeD20Results.includes(20),
    isFumble: activeD20Results.includes(1)
  };
}

export async function rollDiceHandler(params: RollDiceParams): Promise<RollResult> {
  const formula = params.formula.trim();
  if (formula === '') {
    throw new Error('Roll formula is required');
  }
  if (formula.length > MAX_FORMULA_LENGTH) {
    throw new Error(`Roll formula is too long (${String(formula.length)} > ${String(MAX_FORMULA_LENGTH)} characters)`);
  }

  const roll = new Roll(formula);
  const diceCount = countDice(roll);
  if (diceCount > MAX_DICE) {
    throw new Error(`Roll formula asks for too many dice (${String(diceCount)} > ${String(MAX_DICE)})`);
  }
  await roll.evaluate();

  if (params.showInChat) {
    const messageOptions = params.flavor !== undefined ? { flavor: params.flavor } : {};
    await roll.toMessage(messageOptions);
  }

  const dice = extractDiceResults(roll.terms);
  const { isCritical, isFumble } = checkCritical(roll.terms);

  const result: RollResult = {
    total: roll.total,
    formula: roll.formula,
    dice
  };

  if (isCritical) {
    result.isCritical = true;
  }

  if (isFumble) {
    result.isFumble = true;
  }

  return result;
}