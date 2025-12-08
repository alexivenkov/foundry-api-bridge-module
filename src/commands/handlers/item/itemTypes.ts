import type { RollResult } from '@/commands/types';

export interface FoundryDiceTerm {
  faces?: number;
  number?: number;
  results?: Array<{ result: number }>;
}

export interface FoundryRoll {
  total: number;
  formula: string;
  terms: FoundryDiceTerm[];
  isCritical?: boolean;
  isFumble?: boolean;
}

export interface ActivityConsumeConfig {
  resources?: boolean;
  spellSlot?: boolean;
  action?: boolean;
}

export interface FoundryActivity {
  _id: string;
  name: string;
  type: string;
  use(
    usage?: { consume?: ActivityConsumeConfig | false; scaling?: number },
    dialog?: { configure?: boolean },
    message?: { create?: boolean }
  ): Promise<FoundryUsageResult | null>;
}

export interface FoundryActivitiesCollection {
  contents: FoundryActivity[];
  get(id: string): FoundryActivity | undefined;
  find(predicate: (activity: FoundryActivity) => boolean): FoundryActivity | undefined;
}

export interface FoundryItemSystem {
  activities?: FoundryActivitiesCollection;
  uses?: { value: number; max: number; per: string };
  quantity?: number;
  equipped?: boolean;
  attunement?: number;
  identified?: boolean;
}

export interface FoundryChatMessage {
  id: string;
}

export interface FoundryUsageResult {
  rolls?: FoundryRoll[];
  message?: FoundryChatMessage;
}

export interface FoundryItem {
  id: string;
  name: string;
  type: string;
  img: string;
  system: FoundryItemSystem;
  use(
    usage?: { consume?: boolean; scaling?: number },
    dialog?: { configure?: boolean },
    message?: { create?: boolean }
  ): Promise<FoundryUsageResult | null>;
  displayCard(message?: { create?: boolean }): Promise<FoundryChatMessage | null>;
}

export interface FoundryItemsCollection {
  contents: FoundryItem[];
  get(id: string): FoundryItem | undefined;
}

export interface FoundryActor {
  id: string;
  name: string;
  items: FoundryItemsCollection;
}

export interface ActorsCollection {
  get(id: string): FoundryActor | undefined;
}

export interface ItemFoundryGame {
  actors: ActorsCollection;
}

export function getGame(): ItemFoundryGame {
  return (globalThis as unknown as { game: ItemFoundryGame }).game;
}

export function extractDiceResults(terms: FoundryDiceTerm[]): RollResult['dice'] {
  const diceResults: RollResult['dice'] = [];

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