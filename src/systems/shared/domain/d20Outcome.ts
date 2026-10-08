import type { RollMode } from './RollOutcome';

export interface D20TermLike {
  faces?: number;
  results?: ReadonlyArray<{ result: number; active?: boolean }>;
}

export interface D20RollLike {
  terms: ReadonlyArray<D20TermLike>;
  options?: { advantageMode?: number } | undefined;
}

/** dnd5e `D20Roll.ADV_MODE`: 1 advantage, 0 normal, -1 disadvantage. */
export function rollModeOf(roll: D20RollLike): RollMode | undefined {
  const mode = roll.options?.advantageMode;
  if (mode === 1) return 'advantage';
  if (mode === -1) return 'disadvantage';
  if (mode === 0) return 'normal';
  return undefined;
}

/** The d20 result Foundry kept after `kh`/`kl` (the one still marked active). */
export function keptD20Of(roll: D20RollLike): number | undefined {
  const d20 = roll.terms.find((term) => term.faces === 20 && term.results !== undefined);
  if (!d20?.results || d20.results.length === 0) return undefined;
  const active = d20.results.find((r) => r.active !== false);
  return (active ?? d20.results[0])?.result;
}
