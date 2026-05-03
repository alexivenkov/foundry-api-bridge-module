import type { RollDiceParams, RollResult } from '@/commands/types';
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
  const roll = new Roll(params.formula);
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