import type { DiceResult } from '@/commands/types';

export interface FoundryDiceTerm {
  faces?: number;
  number?: number;
  results?: Array<{ result: number }>;
}

export interface FoundryD20Roll {
  total: number;
  formula: string;
  terms: FoundryDiceTerm[];
  isCritical: boolean;
  isFumble: boolean;
}

export interface FoundryDamageRoll {
  total: number;
  formula: string;
  terms: FoundryDiceTerm[];
}

export interface RollDialogConfig {
  configure: boolean;
}

export interface RollMessageConfig {
  create: boolean;
}

export function extractDiceResults(terms: FoundryDiceTerm[]): DiceResult[] {
  const diceResults: DiceResult[] = [];

  for (const term of terms) {
    if (term.faces !== undefined && term.results !== undefined) {
      diceResults.push({
        type: `d${String(term.faces)}`,
        count: term.number ?? 1,
        results: term.results.map(r => r.result)
      });
    }
  }

  return diceResults;
}