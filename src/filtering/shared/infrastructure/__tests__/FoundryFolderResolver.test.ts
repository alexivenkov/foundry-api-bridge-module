import { FolderReference } from '@/filtering/shared/domain/value-objects';

import { FoundryFolderResolver } from '../FoundryFolderResolver';
import type {
  FoundryFolderDocument,
  FoundryFolderGameProvider
} from '../foundryFolderTypes';

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
    type: overrides.type ?? 'Item',
    parent: overrides.parent ?? null,
    getSubfolders: jest.fn((recursive: boolean) => {
      if (!recursive) {
        return subfolders;
      }
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

function makeProvider(opts: SetupOptions = {}): FoundryFolderGameProvider {
  const contents = opts.contents ?? [];
  const byId = opts.byId ?? new Map();
  return {
    getGame: () => ({
      folders: {
        get: (id: string) => byId.get(id),
        contents
      }
    })
  };
}

describe('Shared FoundryFolderResolver — parameterized by folderType', () => {
  describe('respects the supplied folderType ("Item")', () => {
    it('returns ids for Item folders only', () => {
      const itemFolder = createMockFolder({ id: 'fi', name: 'Treasure', type: 'Item' });
      const actorFolder = createMockFolder({ id: 'fa', name: 'Treasure', type: 'Actor' });
      const provider = makeProvider({
        contents: [itemFolder, actorFolder],
        byId: new Map([
          ['fi', itemFolder],
          ['fa', actorFolder]
        ])
      });
      const resolver = new FoundryFolderResolver(provider, 'Item');

      const result = resolver.resolve(new FolderReference(undefined, 'Treasure', false));
      expect(result).toEqual(new Set(['fi']));
    });

    it('byId returns empty when folder type does not match', () => {
      const folder = createMockFolder({ id: 'f1', type: 'Actor' });
      const provider = makeProvider({ byId: new Map([['f1', folder]]) });
      const resolver = new FoundryFolderResolver(provider, 'Item');

      expect(resolver.resolve(new FolderReference('f1', undefined, false))).toEqual(
        new Set()
      );
    });

    it('returns the folder when type matches and id is found', () => {
      const folder = createMockFolder({ id: 'f1', type: 'Item' });
      const provider = makeProvider({ byId: new Map([['f1', folder]]) });
      const resolver = new FoundryFolderResolver(provider, 'Item');

      expect(resolver.resolve(new FolderReference('f1', undefined, false))).toEqual(
        new Set(['f1'])
      );
    });
  });

  describe('respects the supplied folderType ("Actor")', () => {
    it('returns ids for Actor folders only', () => {
      const actorFolder = createMockFolder({ id: 'fa', name: 'Heroes', type: 'Actor' });
      const itemFolder = createMockFolder({ id: 'fi', name: 'Heroes', type: 'Item' });
      const provider = makeProvider({ contents: [actorFolder, itemFolder] });
      const resolver = new FoundryFolderResolver(provider, 'Actor');

      const result = resolver.resolve(new FolderReference(undefined, 'Heroes', false));
      expect(result).toEqual(new Set(['fa']));
    });
  });

  describe('id-only resolution', () => {
    it('returns empty Set when id does not exist', () => {
      const provider = makeProvider();
      const resolver = new FoundryFolderResolver(provider, 'Item');

      expect(resolver.resolve(new FolderReference('nope', undefined, false))).toEqual(
        new Set()
      );
    });
  });

  describe('name-only resolution', () => {
    it('matches by name (case-insensitive)', () => {
      const folder = createMockFolder({ id: 'f1', name: 'Treasure', type: 'Item' });
      const provider = makeProvider({ contents: [folder] });
      const resolver = new FoundryFolderResolver(provider, 'Item');

      const result = resolver.resolve(new FolderReference(undefined, 'TREASURE', false));
      expect(result).toEqual(new Set(['f1']));
    });

    it('returns multiple ids for duplicate folder names', () => {
      const a = createMockFolder({ id: 'fa', name: 'Loot', type: 'Item' });
      const b = createMockFolder({ id: 'fb', name: 'Loot', type: 'Item' });
      const provider = makeProvider({ contents: [a, b] });
      const resolver = new FoundryFolderResolver(provider, 'Item');

      const result = resolver.resolve(new FolderReference(undefined, 'Loot', false));
      expect(result).toEqual(new Set(['fa', 'fb']));
    });

    it('returns empty Set when no folder matches name', () => {
      const folder = createMockFolder({ id: 'f1', name: 'Loot', type: 'Item' });
      const provider = makeProvider({ contents: [folder] });
      const resolver = new FoundryFolderResolver(provider, 'Item');

      expect(resolver.resolve(new FolderReference(undefined, 'Missing', false))).toEqual(
        new Set()
      );
    });
  });

  describe('id + name resolution (intersection)', () => {
    it('returns id when both match', () => {
      const folder = createMockFolder({ id: 'f1', name: 'Loot', type: 'Item' });
      const provider = makeProvider({
        byId: new Map([['f1', folder]]),
        contents: [folder]
      });
      const resolver = new FoundryFolderResolver(provider, 'Item');

      expect(resolver.resolve(new FolderReference('f1', 'Loot', false))).toEqual(
        new Set(['f1'])
      );
    });

    it('returns empty when id matches but name does not', () => {
      const folder = createMockFolder({ id: 'f1', name: 'Loot', type: 'Item' });
      const provider = makeProvider({
        byId: new Map([['f1', folder]]),
        contents: [folder]
      });
      const resolver = new FoundryFolderResolver(provider, 'Item');

      expect(resolver.resolve(new FolderReference('f1', 'Wrong', false))).toEqual(
        new Set()
      );
    });

    it('returns empty when id is missing even if name matches another folder', () => {
      const folder = createMockFolder({ id: 'f1', name: 'Loot', type: 'Item' });
      const provider = makeProvider({
        byId: new Map(),
        contents: [folder]
      });
      const resolver = new FoundryFolderResolver(provider, 'Item');

      expect(resolver.resolve(new FolderReference('missing', 'Loot', false))).toEqual(
        new Set()
      );
    });
  });

  describe('recursive expansion', () => {
    it('expands subfolders when recursive=true', () => {
      const sub = createMockFolder({ id: 'sub', type: 'Item' });
      const root = createMockFolder({
        id: 'root',
        type: 'Item',
        subfolders: [sub]
      });
      const provider = makeProvider({ byId: new Map([['root', root]]) });
      const resolver = new FoundryFolderResolver(provider, 'Item');

      expect(resolver.resolve(new FolderReference('root', undefined, true))).toEqual(
        new Set(['root', 'sub'])
      );
    });

    it('does NOT expand subfolders when recursive=false', () => {
      const sub = createMockFolder({ id: 'sub', type: 'Item' });
      const root = createMockFolder({
        id: 'root',
        type: 'Item',
        subfolders: [sub]
      });
      const provider = makeProvider({ byId: new Map([['root', root]]) });
      const resolver = new FoundryFolderResolver(provider, 'Item');

      expect(resolver.resolve(new FolderReference('root', undefined, false))).toEqual(
        new Set(['root'])
      );
    });

    it('expands recursively for name-matched folders and de-duplicates', () => {
      const sharedSub = createMockFolder({ id: 'shared', type: 'Item' });
      const a = createMockFolder({
        id: 'fa',
        name: 'Same',
        type: 'Item',
        subfolders: [sharedSub]
      });
      const b = createMockFolder({
        id: 'fb',
        name: 'Same',
        type: 'Item',
        subfolders: [sharedSub]
      });
      const provider = makeProvider({ contents: [a, b] });
      const resolver = new FoundryFolderResolver(provider, 'Item');

      expect(resolver.resolve(new FolderReference(undefined, 'Same', true))).toEqual(
        new Set(['fa', 'fb', 'shared'])
      );
    });
  });
});
