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

export interface FoundryItemsCollection {
  get(id: string): FoundryItem | undefined;
}

export interface FoundryItem {
  id: string;
  name: string;
  type: string;
  img: string;
  system: Record<string, unknown>;
}

export interface FoundryActor {
  id: string;
  uuid: string;
  name: string;
  type: string;
  img: string;
  folder: { id: string; name: string } | null;
  items: FoundryItemsCollection;
  system: Record<string, unknown>;
  update(data: Record<string, unknown>): Promise<FoundryActor>;
  delete(): Promise<FoundryActor>;
  toObject(source?: boolean): Record<string, unknown>;
}

export interface ActorsCollection {
  get(id: string): FoundryActor | undefined;
}

export interface FoundryPack {
  collection: string;
  metadata: {
    type: string;
  };
  getDocument(id: string): Promise<FoundryActor | null>;
}

export interface PacksCollection {
  get(id: string): FoundryPack | undefined;
}

export interface FoundryGame {
  actors: ActorsCollection & {
    documentClass: {
      create(data: Record<string, unknown>): Promise<FoundryActor>;
      createDocuments(data: Record<string, unknown>[]): Promise<FoundryActor[]>;
    };
  };
  packs: PacksCollection;
}

declare const game: FoundryGame;
export { game };