// Narrow structural types over the pf2e compendium surface. The pf2e system
// data model drifts between releases, so every nested field is `unknown` and
// narrowed in the mappers (verified against installed pf2e 7.12.2).

export interface Pf2eCompendiumDocument {
  readonly id: string;
  readonly uuid: string;
  readonly name: string;
  readonly type: string;
  readonly system: Record<string, unknown>;
}

export interface Pf2eCompendiumPack {
  collection: string;
  metadata: { type: string };
  getDocuments(): Promise<Pf2eCompendiumDocument[]>;
}

export interface Pf2eCompendiumPacksCollection {
  get(id: string): Pf2eCompendiumPack | undefined;
  forEach(fn: (pack: Pf2eCompendiumPack) => void): void;
}

export interface Pf2eCompendiumGameGlobals {
  packs: Pf2eCompendiumPacksCollection | undefined;
}

export interface Pf2eCompendiumGameProvider {
  getGame(): Pf2eCompendiumGameGlobals;
}

export const defaultPf2eCompendiumGameProvider: Pf2eCompendiumGameProvider = {
  getGame(): Pf2eCompendiumGameGlobals {
    return (globalThis as unknown as { game: Pf2eCompendiumGameGlobals }).game;
  }
};
