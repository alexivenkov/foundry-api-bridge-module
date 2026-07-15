import type { FoundryActor } from './foundryActorTypes';

// Compendium documents expose the same live getters the world mapper reads
// (id, type, system, prototypeToken, hasPlayerOwner) plus a uuid.
export interface FoundryCompendiumActorDocument extends FoundryActor {
  readonly uuid: string;
}

export interface FoundryActorCompendiumPack {
  collection: string;
  metadata: { type: string };
  getDocuments(): Promise<FoundryCompendiumActorDocument[]>;
}

export interface FoundryActorPacksCollection {
  get(id: string): FoundryActorCompendiumPack | undefined;
  forEach(fn: (pack: FoundryActorCompendiumPack) => void): void;
}

export interface CompendiumFilteringGameGlobals {
  packs: FoundryActorPacksCollection | undefined;
}

export interface CompendiumFilteringGameProvider {
  getGame(): CompendiumFilteringGameGlobals;
}

export const defaultCompendiumFilteringGameProvider: CompendiumFilteringGameProvider = {
  getGame(): CompendiumFilteringGameGlobals {
    return (globalThis as unknown as { game: CompendiumFilteringGameGlobals }).game;
  }
};
