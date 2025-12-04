import type { RollDiceParams, RollResult, DiceResult } from '@/commands/types';
import { extractDiceResults } from '@/commands/handlers/shared';
import type { FoundryDiceTerm } from '@/commands/handlers/shared';

interface FoundryRoll {
  evaluate(): Promise<FoundryRoll>;
  toMessage(options?: { flavor?: string }): Promise<unknown>;
  total: number;
  formula: string;
  terms: FoundryDiceTerm[];
}

interface RollConstructor {
  new (formula: string): FoundryRoll;
}

declare const Roll: RollConstructor;

function checkCritical(dice: DiceResult[]): { isCritical: boolean; isFumble: boolean } {
  const d20 = dice.find(d => d.type === 'd20' && d.count === 1);

  if (!d20 || d20.results.length !== 1) {
    return { isCritical: false, isFumble: false };
  }

  const result = d20.results[0];
  return {
    isCritical: result === 20,
    isFumble: result === 1
  };
}

export async function rollDiceHandler(params: RollDiceParams): Promise<RollResult> {
  const roll = new Roll(params.formula);
  await roll.evaluate();

  if (params.showInChat) {
    const messageOptions = params.flavor !== undefined ? { flavor: params.flavor } : {};
    await roll.toMessage(messageOptions);
  }

  const dice = extractDiceResults(roll.terms);
  const { isCritical, isFumble } = checkCritical(dice);

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