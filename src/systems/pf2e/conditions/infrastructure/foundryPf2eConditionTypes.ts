/**
 * Minimal anti-corruption view of the PF2e Foundry condition API (pf2e 7.12.2).
 */

export interface FoundryConditionItem {
  id: string;
  slug: string;
  name: string;
  value: number | null;
  active: boolean;
  update(data: Record<string, unknown>): Promise<unknown>;
}

export interface FoundryConditionsCollection {
  active: FoundryConditionItem[];
}

export interface IncreaseConditionOptions {
  value?: number;
}

export interface DecreaseConditionOptions {
  forceRemove?: boolean;
}

export interface FoundryPf2eConditionActor {
  id: string;
  name: string;
  conditions: FoundryConditionsCollection;
  increaseCondition(slug: string, options?: IncreaseConditionOptions): Promise<unknown>;
  decreaseCondition(slug: string, options?: DecreaseConditionOptions): Promise<void>;
  getCondition(slug: string): FoundryConditionItem | null;
}

export interface FoundryPf2eConditionActorsCollection {
  get(id: string): FoundryPf2eConditionActor | undefined;
}

export interface FoundryPf2eConditionGame {
  actors: FoundryPf2eConditionActorsCollection;
}

export function getPf2eConditionGame(): FoundryPf2eConditionGame {
  return (globalThis as unknown as { game: FoundryPf2eConditionGame }).game;
}
