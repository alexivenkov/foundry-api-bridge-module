import type {
  FoundryCreatedWorldDocument,
  FoundryManagedPack,
  FoundryManagedPackIndex,
  FoundryManagementGame,
  FoundryPackDocumentLike,
  FoundryPackFolder,
  FoundryWorldCollection,
  FoundryWorldDocument,
  FoundryWorldFolder,
  PackManagementGameProvider,
  PackManagementGlobals
} from '../foundryPackManagementTypes';

export interface IndexEntry {
  _id: string;
  folder?: string | null;
}

export function packIndex(entries: IndexEntry[]): FoundryManagedPackIndex & { entries: IndexEntry[] } {
  return {
    entries,
    get size() {
      return entries.length;
    },
    keys: () => entries.map(entry => entry._id),
    forEach: fn => entries.forEach(fn)
  };
}

export function packFolder(id: string, name: string, parent: string | null = null): FoundryPackFolder {
  return {
    id,
    name,
    _source: { folder: parent },
    toObject: () => ({ _id: id, name, type: 'Actor', folder: parent, sorting: 'a', sort: 0 })
  };
}

export function packDocument(id: string, overrides: Partial<FoundryPackDocumentLike> = {}): FoundryPackDocumentLike {
  return {
    id,
    uuid: `Compendium.world.monsters.Actor.${id}`,
    name: `Doc ${id}`,
    type: 'npc',
    img: 'icons/goblin.webp',
    _source: { folder: null },
    update: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
    ...overrides
  };
}

export type FakePack = FoundryManagedPack & {
  configure: jest.Mock;
  deleteCompendium: jest.Mock;
  duplicateCompendium: jest.Mock;
  importDocument: jest.Mock;
  importAll: jest.Mock;
  getIndex: jest.Mock;
  getDocument: jest.Mock;
  getDocuments: jest.Mock;
};

export function fakePack(overrides: Partial<FoundryManagedPack> = {}): FakePack {
  const index = overrides.index ?? packIndex([{ _id: 'd1', folder: 'pf1' }, { _id: 'd2', folder: null }]);
  const folders = [packFolder('pf1', 'Undead'), packFolder('pf2', 'Ghouls', 'pf1')];
  const documents = new Map([
    ['d1', packDocument('d1', { _source: { folder: 'pf1' } })],
    ['d2', packDocument('d2')]
  ]);
  return {
    collection: 'world.monsters',
    title: 'Monsters',
    metadata: { label: 'Monsters', type: 'Actor', system: 'dnd5e', packageType: 'world', packageName: 'my-world' },
    index,
    locked: false,
    ownership: { PLAYER: 'OBSERVER', ASSISTANT: 'OWNER' },
    folder: null,
    folders: { contents: folders, get: (id: string) => folders.find(folder => folder.id === id) },
    configure: jest.fn().mockResolvedValue(undefined),
    deleteCompendium: jest.fn().mockResolvedValue(undefined),
    duplicateCompendium: jest.fn(),
    importDocument: jest.fn(),
    importAll: jest.fn().mockResolvedValue([]),
    getIndex: jest.fn().mockResolvedValue(index),
    getDocument: jest.fn((id: string) => Promise.resolve(documents.get(id) ?? null)),
    getDocuments: jest.fn((query?: Record<string, unknown>) => {
      const ids = query?.['_id__in'];
      const all = [...documents.values()];
      return Promise.resolve(Array.isArray(ids) ? all.filter(document => ids.includes(document.id)) : all);
    }),
    ...overrides
  } as FakePack;
}

export function worldDocument(id: string, name: string): FoundryWorldDocument & { clone: jest.Mock } {
  const document: FoundryWorldDocument & { clone: jest.Mock } = {
    id,
    name,
    clone: jest.fn((data: Record<string, unknown>) => ({ ...document, ...data, cloned: true }))
  };
  return document;
}

export function worldFolder(
  id: string,
  type: string,
  overrides: Partial<FoundryWorldFolder> = {}
): FoundryWorldFolder & { exportToCompendium: jest.Mock } {
  return {
    id,
    name: `Folder ${id}`,
    type,
    _source: { folder: null },
    contents: [],
    getSubfolders: () => [],
    exportToCompendium: jest.fn(),
    ...overrides
  } as FoundryWorldFolder & { exportToCompendium: jest.Mock };
}

export type FakeCollection = FoundryWorldCollection & {
  createDocuments: jest.Mock;
  fromCompendium: jest.Mock;
};

export function worldCollection(documents: FoundryWorldDocument[] = []): FakeCollection {
  const createDocuments = jest.fn((data: Record<string, unknown>[]) =>
    Promise.resolve(
      data.map((entry, index): FoundryCreatedWorldDocument => ({
        id: typeof entry['_id'] === 'string' ? entry['_id'] : `new${String(index)}`,
        name: String(entry['name'])
      }))
    )
  );
  return {
    get: (id: string) => documents.find(document => document.id === id),
    has: (id: string) => documents.some(document => document.id === id),
    documentClass: { createDocuments },
    createDocuments,
    fromCompendium: jest.fn((document: FoundryPackDocumentLike, options: Record<string, unknown>) => ({
      ...(options['keepId'] === true ? { _id: document.id } : {}),
      name: document.name,
      folder: document._source.folder ?? null
    }))
  };
}

export interface FakeWorld {
  game: FoundryManagementGame;
  provider: PackManagementGameProvider;
  packs: Map<string, FakePack>;
  folders: FoundryWorldFolder[];
  collections: Map<string, FakeCollection>;
  settings: Record<string, unknown>;
}

export function fakeWorld(options: { packs?: FakePack[]; folders?: FoundryWorldFolder[] } = {}): FakeWorld {
  const packs = new Map((options.packs ?? [fakePack()]).map(pack => [pack.collection, pack]));
  const folders = options.folders ?? [worldFolder('wf1', 'Actor'), worldFolder('cf1', 'Compendium')];
  const collections = new Map<string, FakeCollection>([
    ['Actor', worldCollection([worldDocument('a1', 'Goblin')])],
    ['Folder', worldCollection()]
  ]);
  const settings: Record<string, unknown> = {};
  const game: FoundryManagementGame = {
    packs: { get: (id: string) => packs.get(id) },
    folders: {
      get: (id: string) => folders.find(folder => folder.id === id),
      has: (id: string) => folders.some(folder => folder.id === id),
      get contents() {
        return folders;
      }
    },
    collections: { get: (name: string) => collections.get(name) },
    settings: {
      get: (namespace: string, key: string) => {
        const value = settings[`${namespace}.${key}`];
        if (value === undefined) throw new Error(`Setting ${namespace}.${key} is not registered`);
        return value;
      }
    }
  };
  return { game, provider: { getGame: () => game }, packs, folders, collections, settings };
}

export function fakeGlobals(overrides: Partial<PackManagementGlobals> = {}): PackManagementGlobals {
  return {
    compendiumCollectionClass: () => undefined,
    compendiumDocumentTypes: () => ['Actor', 'Adventure', 'Cards', 'Item', 'JournalEntry', 'Macro', 'Playlist', 'RollTable', 'Scene'],
    slugify: (label: string) => label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    adventureClass: () => undefined,
    folderClass: () => undefined,
    ...overrides
  };
}
