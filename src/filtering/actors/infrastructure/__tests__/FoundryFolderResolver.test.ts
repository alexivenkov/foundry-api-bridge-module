import { FolderReference } from '@/filtering/actors/domain/value-objects';

import { FoundryFolderResolver } from '../FoundryFolderResolver';
import type { FoundryGameProvider } from '../foundryGameProvider';
import type {
  FoundryFolderDocument,
  FoundryGameGlobals
} from '../foundryActorTypes';

interface MockFolderOverrides {
  id?: string;
  name?: string;
  type?: string;
  parent?: FoundryFolderDocument | null;
  subfolders?: FoundryFolderDocument[];
}

function createMockFolder(overrides: MockFolderOverrides = {}): FoundryFolderDocument {
  const subfolders = overrides.subfolders ?? [];
  return {
    id: overrides.id ?? 'folder-1',
    name: overrides.name ?? 'Folder',
    type: overrides.type ?? 'Actor',
    parent: overrides.parent ?? null,
    getSubfolders: jest.fn((recursive: boolean) => {
      if (!recursive) {
        return subfolders;
      }
      // Mimic Foundry: recursive=true flattens descendants
      const out: FoundryFolderDocument[] = [];
      for (const sub of subfolders) {
        out.push(sub);
        out.push(...sub.getSubfolders(true));
      }
      return out;
    })
  };
}

interface SetupOptions {
  contents?: FoundryFolderDocument[];
  byId?: Map<string, FoundryFolderDocument>;
}

function makeProvider(opts: SetupOptions = {}): {
  provider: FoundryGameProvider;
  game: FoundryGameGlobals;
  getMock: jest.Mock;
} {
  const contents = opts.contents ?? [];
  const byId = opts.byId ?? new Map();
  const getMock = jest.fn(
    (id: string): FoundryFolderDocument | undefined => byId.get(id)
  );
  const game: FoundryGameGlobals = {
    actors: { contents: [] },
    folders: {
      get: getMock,
      contents
    }
  };
  return {
    provider: { getGame: () => game },
    game,
    getMock
  };
}

describe('FoundryFolderResolver', () => {
  describe('resolve by id only', () => {
    it('returns Set with folder id when folder exists and type=Actor, recursive=false', () => {
      const folder = createMockFolder({ id: 'f1', type: 'Actor' });
      const { provider } = makeProvider({ byId: new Map([['f1', folder]]) });
      const resolver = new FoundryFolderResolver(provider);

      const result = resolver.resolve(new FolderReference('f1', undefined, false));

      expect(result).toEqual(new Set(['f1']));
    });

    it('returns empty Set when folder is not Actor type', () => {
      const folder = createMockFolder({ id: 'f1', type: 'Item' });
      const { provider } = makeProvider({ byId: new Map([['f1', folder]]) });
      const resolver = new FoundryFolderResolver(provider);

      const result = resolver.resolve(new FolderReference('f1', undefined, false));

      expect(result).toEqual(new Set());
    });

    it('returns empty Set when folder does not exist', () => {
      const { provider } = makeProvider();
      const resolver = new FoundryFolderResolver(provider);

      const result = resolver.resolve(new FolderReference('nope', undefined, false));

      expect(result).toEqual(new Set());
    });
  });

  describe('resolve by name only', () => {
    it('returns matching folder ids by name (case-insensitive)', () => {
      const folder = createMockFolder({ id: 'f1', name: 'Heroes', type: 'Actor' });
      const { provider } = makeProvider({ contents: [folder] });
      const resolver = new FoundryFolderResolver(provider);

      const result = resolver.resolve(new FolderReference(undefined, 'heroes', false));

      expect(result).toEqual(new Set(['f1']));
    });

    it('returns multiple ids when multiple folders share the name', () => {
      const a = createMockFolder({ id: 'f1', name: 'Bosses', type: 'Actor' });
      const b = createMockFolder({ id: 'f2', name: 'Bosses', type: 'Actor' });
      const { provider } = makeProvider({ contents: [a, b] });
      const resolver = new FoundryFolderResolver(provider);

      const result = resolver.resolve(new FolderReference(undefined, 'Bosses', false));

      expect(result).toEqual(new Set(['f1', 'f2']));
    });

    it('skips non-Actor folders even with matching name', () => {
      const a = createMockFolder({ id: 'f1', name: 'Mixed', type: 'Item' });
      const b = createMockFolder({ id: 'f2', name: 'Mixed', type: 'Actor' });
      const { provider } = makeProvider({ contents: [a, b] });
      const resolver = new FoundryFolderResolver(provider);

      const result = resolver.resolve(new FolderReference(undefined, 'Mixed', false));

      expect(result).toEqual(new Set(['f2']));
    });

    it('returns empty Set when no folder matches name', () => {
      const folder = createMockFolder({ id: 'f1', name: 'Heroes', type: 'Actor' });
      const { provider } = makeProvider({ contents: [folder] });
      const resolver = new FoundryFolderResolver(provider);

      const result = resolver.resolve(new FolderReference(undefined, 'Villains', false));

      expect(result).toEqual(new Set());
    });
  });

  describe('resolve by id AND name', () => {
    it('returns folder id when both match (intersection)', () => {
      const folder = createMockFolder({ id: 'f1', name: 'Heroes', type: 'Actor' });
      const { provider } = makeProvider({
        byId: new Map([['f1', folder]]),
        contents: [folder]
      });
      const resolver = new FoundryFolderResolver(provider);

      const result = resolver.resolve(new FolderReference('f1', 'Heroes', false));

      expect(result).toEqual(new Set(['f1']));
    });

    it('returns empty Set when id matches but name does not', () => {
      const folder = createMockFolder({ id: 'f1', name: 'Heroes', type: 'Actor' });
      const { provider } = makeProvider({
        byId: new Map([['f1', folder]]),
        contents: [folder]
      });
      const resolver = new FoundryFolderResolver(provider);

      const result = resolver.resolve(new FolderReference('f1', 'Villains', false));

      expect(result).toEqual(new Set());
    });

    it('returns empty Set when id does not exist even if name matches another', () => {
      const folder = createMockFolder({ id: 'f1', name: 'Heroes', type: 'Actor' });
      const { provider } = makeProvider({
        byId: new Map(),
        contents: [folder]
      });
      const resolver = new FoundryFolderResolver(provider);

      const result = resolver.resolve(new FolderReference('missing', 'Heroes', false));

      expect(result).toEqual(new Set());
    });
  });

  describe('recursive expansion', () => {
    it('includes subfolder ids when recursive=true', () => {
      const subA = createMockFolder({ id: 'sub-a', type: 'Actor' });
      const subB = createMockFolder({ id: 'sub-b', type: 'Actor' });
      const subC = createMockFolder({ id: 'sub-c', type: 'Actor' });
      const root = createMockFolder({
        id: 'root',
        type: 'Actor',
        subfolders: [subA, subB, subC]
      });
      const { provider } = makeProvider({ byId: new Map([['root', root]]) });
      const resolver = new FoundryFolderResolver(provider);

      const result = resolver.resolve(new FolderReference('root', undefined, true));

      expect(result).toEqual(new Set(['root', 'sub-a', 'sub-b', 'sub-c']));
    });

    it('does not include subfolder ids when recursive=false', () => {
      const sub = createMockFolder({ id: 'sub', type: 'Actor' });
      const root = createMockFolder({
        id: 'root',
        type: 'Actor',
        subfolders: [sub]
      });
      const { provider } = makeProvider({ byId: new Map([['root', root]]) });
      const resolver = new FoundryFolderResolver(provider);

      const result = resolver.resolve(new FolderReference('root', undefined, false));

      expect(result).toEqual(new Set(['root']));
    });

    it('expands recursively for name-matched folders', () => {
      const subA = createMockFolder({ id: 'sub-a', type: 'Actor' });
      const root = createMockFolder({
        id: 'root',
        name: 'Mobs',
        type: 'Actor',
        subfolders: [subA]
      });
      const { provider } = makeProvider({ contents: [root] });
      const resolver = new FoundryFolderResolver(provider);

      const result = resolver.resolve(new FolderReference(undefined, 'Mobs', true));

      expect(result).toEqual(new Set(['root', 'sub-a']));
    });

    it('passes recursive=true to getSubfolders', () => {
      const sub = createMockFolder({ id: 'sub', type: 'Actor' });
      const getSubfoldersSpy = jest.fn(() => [sub]);
      const root: FoundryFolderDocument = {
        id: 'root',
        name: 'Root',
        type: 'Actor',
        parent: null,
        getSubfolders: getSubfoldersSpy
      };
      const { provider } = makeProvider({ byId: new Map([['root', root]]) });
      const resolver = new FoundryFolderResolver(provider);

      resolver.resolve(new FolderReference('root', undefined, true));

      expect(getSubfoldersSpy).toHaveBeenCalledWith(true);
    });
  });

  describe('multi-folder name match with recursion', () => {
    it('expands every matched folder and de-duplicates ids in the resulting Set', () => {
      const sharedSub = createMockFolder({ id: 'shared', type: 'Actor' });
      const a = createMockFolder({
        id: 'fa',
        name: 'Same',
        type: 'Actor',
        subfolders: [sharedSub]
      });
      const b = createMockFolder({
        id: 'fb',
        name: 'Same',
        type: 'Actor',
        subfolders: [sharedSub]
      });
      const { provider } = makeProvider({ contents: [a, b] });
      const resolver = new FoundryFolderResolver(provider);

      const result = resolver.resolve(new FolderReference(undefined, 'Same', true));

      expect(result).toEqual(new Set(['fa', 'fb', 'shared']));
    });
  });
});
