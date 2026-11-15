// The shapes the world-info and compendium handler tests build their fake
// `game` from. The handlers read `game` through their own contexts.

export interface FoundryWorld {
  id: string;
  title: string;
}

export interface FoundrySystem {
  id: string;
  version: string;
}

export interface FoundryPackMetadata {
  label: string;
  type: string;
  system: string | undefined;
  packageName: string;
}

export interface FoundryPackIndex {
  size: number;
}

export interface FoundryPack {
  collection: string;
  metadata: FoundryPackMetadata;
  index: FoundryPackIndex;
}

export interface FoundryCollection<T> {
  size: number;
  forEach(fn: (item: T) => void): void;
}

export interface FoundryModule {
  version: string | undefined;
}

export interface FoundryGame {
  world: FoundryWorld | undefined;
  system: FoundrySystem | undefined;
  version: string | undefined;
  modules?: { get(id: string): FoundryModule | undefined } | undefined;
  journal: FoundryCollection<unknown> | undefined;
  actors: FoundryCollection<unknown> | undefined;
  items: FoundryCollection<unknown> | undefined;
  scenes: FoundryCollection<unknown> | undefined;
  packs: FoundryCollection<FoundryPack> | undefined;
}
