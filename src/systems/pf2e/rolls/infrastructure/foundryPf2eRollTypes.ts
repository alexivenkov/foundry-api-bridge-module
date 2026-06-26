/**
 * Minimal anti-corruption view of the PF2e Foundry roll API (pf2e 7.12.2).
 * Only the members the gateway needs are modelled here.
 */

export interface FoundryPf2eDie {
  faces?: number;
  number?: number;
  results?: Array<{ result: number }>;
}

/**
 * A rolled PF2e `CheckRoll` (extends Foundry `Roll`). `degreeOfSuccess` is the
 * getter exposing 0=critFail, 1=fail, 2=success, 3=critSuccess (or null).
 */
export interface FoundryCheckRoll {
  total: number;
  formula: string;
  dice: FoundryPf2eDie[];
  degreeOfSuccess?: number | null;
}

export interface StatisticRollArgs {
  skipDialog?: boolean;
  createMessage?: boolean;
}

export interface FoundryStatisticCheck {
  roll(args?: StatisticRollArgs): Promise<FoundryCheckRoll | null>;
}

export interface FoundryStatistic {
  check: FoundryStatisticCheck;
}

export interface FoundryPf2eActor {
  id: string;
  name: string;
  skills: Record<string, FoundryStatistic | undefined>;
  saves: Record<string, FoundryStatistic | undefined>;
  perception: FoundryStatistic;
}

export interface FoundryPf2eActorsCollection {
  get(id: string): FoundryPf2eActor | undefined;
}

export interface FoundryPf2eRollGame {
  actors: FoundryPf2eActorsCollection;
}

export function getPf2eRollGame(): FoundryPf2eRollGame {
  return (globalThis as unknown as { game: FoundryPf2eRollGame }).game;
}
