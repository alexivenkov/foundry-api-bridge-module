import type { CompendiumGameProvider } from '../foundryGameProvider';
import type {
  CompendiumGameGlobals,
  FoundryPack,
  FoundryPackIndex,
  RawIndexEntry
} from '../foundryPackTypes';

export function makeIndex(
  entries: RawIndexEntry[],
  opts: { withContents?: boolean } = {}
): FoundryPackIndex {
  const { withContents = true } = opts;
  const index: FoundryPackIndex = {
    size: entries.length,
    get: (id: string) => entries.find(e => (e._id ?? e.id) === id),
    forEach: (fn: (entry: RawIndexEntry) => void) => {
      entries.forEach(fn);
    }
  };
  if (withContents) {
    index.contents = entries;
  }
  return index;
}

export function makePack(overrides: Partial<FoundryPack> = {}): FoundryPack {
  return {
    collection: 'world.test-pack',
    metadata: { label: 'Test Pack', type: 'Item', system: 'dnd5e', packageName: 'world' },
    index: makeIndex([]),
    getIndex: jest.fn(async () => makeIndex([])),
    search: jest.fn(() => [] as RawIndexEntry[]),
    getDocument: jest.fn(async () => null),
    getDocuments: jest.fn(async () => []),
    ...overrides
  };
}

export function makeGame(
  overrides: Partial<CompendiumGameGlobals> = {}
): CompendiumGameGlobals {
  return {
    packs: undefined,
    actors: {
      get: jest.fn(() => undefined),
      documentClass: { create: jest.fn() }
    },
    items: {
      documentClass: { create: jest.fn() }
    },
    ...overrides
  } as CompendiumGameGlobals;
}

export function makePacksCollection(packs: FoundryPack[]): {
  get(id: string): FoundryPack | undefined;
  forEach(fn: (pack: FoundryPack) => void): void;
} {
  return {
    get: (id: string) => packs.find(p => p.collection === id),
    forEach: (fn: (pack: FoundryPack) => void) => {
      packs.forEach(fn);
    }
  };
}

export function providerFor(game: CompendiumGameGlobals): CompendiumGameProvider {
  return { getGame: () => game };
}
