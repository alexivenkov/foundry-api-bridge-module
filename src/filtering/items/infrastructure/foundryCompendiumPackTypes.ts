import type { FoundryItem } from './foundryItemTypes';

// Compendium documents expose the same live getters the world mapper reads
// (id, type, system) plus a uuid.
export interface FoundryCompendiumItemDocument extends FoundryItem {
  readonly uuid: string;
}

export interface FoundryItemCompendiumPack {
  collection: string;
  metadata: { type: string };
  getDocuments(): Promise<FoundryCompendiumItemDocument[]>;
}

export interface FoundryItemPacksCollection {
  get(id: string): FoundryItemCompendiumPack | undefined;
  forEach(fn: (pack: FoundryItemCompendiumPack) => void): void;
}

export interface CompendiumItemFilteringGameGlobals {
  packs: FoundryItemPacksCollection | undefined;
}

export interface CompendiumItemFilteringGameProvider {
  getGame(): CompendiumItemFilteringGameGlobals;
}

export const defaultCompendiumItemFilteringGameProvider: CompendiumItemFilteringGameProvider = {
  getGame(): CompendiumItemFilteringGameGlobals {
    return (globalThis as unknown as { game: CompendiumItemFilteringGameGlobals }).game;
  }
};
