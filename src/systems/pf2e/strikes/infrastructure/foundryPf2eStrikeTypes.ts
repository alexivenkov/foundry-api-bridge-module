/**
 * Minimal anti-corruption view of the PF2e strike API (pf2e 7.12.2),
 * `actor.system.actions` with `variants[].roll`, `damage`, `critical`.
 */

export interface FoundryStrikeDie {
  faces?: number;
  number?: number;
  results?: Array<{ result: number }>;
}

export interface FoundryCheckRoll {
  total: number;
  formula: string;
  dice: FoundryStrikeDie[];
  degreeOfSuccess?: number | null;
}

export interface FoundryDamageRoll {
  total: number;
  formula: string;
  dice: FoundryStrikeDie[];
}

export interface StrikeRollParams {
  createMessage?: boolean;
}

export interface FoundryStrikeVariant {
  label: string;
  roll(params?: StrikeRollParams): Promise<FoundryCheckRoll | null>;
}

export type FoundryDamageRollFunction = (
  params?: StrikeRollParams
) => Promise<FoundryDamageRoll | string | null>;

export interface FoundryStrikeAction {
  type: string;
  slug: string;
  label: string;
  ready: boolean;
  variants: FoundryStrikeVariant[];
  damage?: FoundryDamageRollFunction;
  critical?: FoundryDamageRollFunction;
}

export interface FoundryStrikeActor {
  id: string;
  name: string;
  system: { actions?: FoundryStrikeAction[] };
}

export interface FoundryStrikeActorsCollection {
  get(id: string): FoundryStrikeActor | undefined;
}

export interface FoundryPf2eStrikeGame {
  actors: FoundryStrikeActorsCollection;
}

export function getPf2eStrikeGame(): FoundryPf2eStrikeGame {
  return (globalThis as unknown as { game: FoundryPf2eStrikeGame }).game;
}
