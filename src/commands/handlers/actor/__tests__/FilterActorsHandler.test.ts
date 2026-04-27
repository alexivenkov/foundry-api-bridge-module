import type { FilterActorsParams } from '@/commands/types';
import type {
  FoundryActor,
  FoundryFolderDocument,
  FoundryGameGlobals
} from '@/filtering/actors/infrastructure';

import { createFilterActorsHandler } from '../FilterActorsHandler';

interface MockActorOverrides {
  id?: string;
  name?: string;
  type?: string;
  hasPlayerOwner?: boolean;
  folderId?: string | null;
  creatureType?: string;
  size?: string;
  disposition?: number;
  cr?: number;
  level?: number;
  hp?: { value: number; max: number };
  ac?: number;
  abilities?: { str: number; dex: number; con: number; int: number; wis: number; cha: number };
}

function createMockActor(o: MockActorOverrides = {}): FoundryActor {
  const folder = o.folderId !== undefined && o.folderId !== null
    ? { id: o.folderId }
    : null;
  const actor: FoundryActor = {
    id: o.id ?? 'actor-1',
    name: o.name ?? 'Test Actor',
    type: o.type ?? 'npc',
    hasPlayerOwner: o.hasPlayerOwner ?? false,
    folder,
    system: {
      details: {
        ...(o.cr !== undefined ? { cr: o.cr } : {}),
        ...(o.level !== undefined ? { level: o.level } : {}),
        ...(o.creatureType !== undefined ? { type: { value: o.creatureType } } : {})
      },
      traits: o.size !== undefined ? { size: o.size } : {},
      attributes: {
        ...(o.hp !== undefined ? { hp: o.hp } : {}),
        ...(o.ac !== undefined ? { ac: { value: o.ac } } : {})
      },
      ...(o.abilities !== undefined
        ? {
            abilities: {
              str: { value: o.abilities.str },
              dex: { value: o.abilities.dex },
              con: { value: o.abilities.con },
              int: { value: o.abilities.int },
              wis: { value: o.abilities.wis },
              cha: { value: o.abilities.cha }
            }
          }
        : {})
    },
    ...(o.disposition !== undefined
      ? { prototypeToken: { disposition: o.disposition } }
      : {})
  };
  return actor;
}

interface MakeGameOptions {
  actors?: readonly FoundryActor[];
  folders?: readonly FoundryFolderDocument[];
  folderById?: Map<string, FoundryFolderDocument>;
}

function makeGame(opts: MakeGameOptions = {}): FoundryGameGlobals {
  const folderById = opts.folderById ?? new Map<string, FoundryFolderDocument>();
  return {
    actors: { contents: opts.actors ?? [] },
    folders: {
      get: (id: string) => folderById.get(id),
      contents: opts.folders ?? []
    }
  };
}

function makeFolder(o: {
  id: string;
  name?: string;
  type?: string;
}): FoundryFolderDocument {
  return {
    id: o.id,
    name: o.name ?? 'Folder',
    type: o.type ?? 'Actor',
    parent: null,
    getSubfolders: () => []
  };
}

describe('FilterActorsHandler', () => {
  describe('input validation', () => {
    it('throws Error with formatted message when limit is out of range', async () => {
      const game = makeGame();
      const handler = createFilterActorsHandler({
        gameProvider: { getGame: () => game }
      });

      await expect(
        handler({ limit: 250 } as FilterActorsParams)
      ).rejects.toThrow(/limit/);
    });

    it('throws Error when offset is negative', async () => {
      const game = makeGame();
      const handler = createFilterActorsHandler({
        gameProvider: { getGame: () => game }
      });

      await expect(
        handler({ offset: -5 } as FilterActorsParams)
      ).rejects.toThrow(/offset/);
    });

    it('throws Error when type contains an unknown value', async () => {
      const game = makeGame();
      const handler = createFilterActorsHandler({
        gameProvider: { getGame: () => game }
      });

      await expect(
        handler({ type: ['invalid-type'] } as FilterActorsParams)
      ).rejects.toThrow();
    });
  });

  describe('happy path', () => {
    it('returns empty result for an empty world', async () => {
      const game = makeGame({ actors: [] });
      const handler = createFilterActorsHandler({
        gameProvider: { getGame: () => game }
      });

      const result = await handler({});

      expect(result).toEqual({ results: [], total: 0, hasMore: false });
    });

    it('returns all actors with sorted result and correct shape', async () => {
      const game = makeGame({
        actors: [
          createMockActor({ id: 'a1', name: 'Bob', type: 'character' }),
          createMockActor({ id: 'a2', name: 'Alice', type: 'character' })
        ]
      });
      const handler = createFilterActorsHandler({
        gameProvider: { getGame: () => game }
      });

      const result = await handler({});

      expect(result.total).toBe(2);
      expect(result.hasMore).toBe(false);
      expect(result.results).toEqual([
        { id: 'a2', name: 'Alice' },
        { id: 'a1', name: 'Bob' }
      ]);
    });
  });

  describe('filtering', () => {
    it('filters by actor type', async () => {
      const game = makeGame({
        actors: [
          createMockActor({ id: 'a1', name: 'Hero', type: 'character' }),
          createMockActor({ id: 'a2', name: 'Goblin', type: 'npc' }),
          createMockActor({ id: 'a3', name: 'Cart', type: 'vehicle' })
        ]
      });
      const handler = createFilterActorsHandler({
        gameProvider: { getGame: () => game }
      });

      const result = await handler({ type: ['npc'] });

      expect(result.total).toBe(1);
      expect(result.results).toEqual([{ id: 'a2', name: 'Goblin' }]);
    });

    it('filters by name substring (case-insensitive)', async () => {
      const game = makeGame({
        actors: [
          createMockActor({ id: 'a1', name: 'Goblin Warrior', type: 'npc' }),
          createMockActor({ id: 'a2', name: 'Orc Brute', type: 'npc' }),
          createMockActor({ id: 'a3', name: 'Goblin Shaman', type: 'npc' })
        ]
      });
      const handler = createFilterActorsHandler({
        gameProvider: { getGame: () => game }
      });

      const result = await handler({ name: 'goblin' });

      expect(result.total).toBe(2);
      expect(result.results.map((r) => r.id).sort()).toEqual(['a1', 'a3']);
    });

    it('combines multiple filters in one query', async () => {
      const matching = createMockActor({
        id: 'match',
        name: 'Brave Hero',
        type: 'character',
        hasPlayerOwner: true,
        creatureType: 'humanoid',
        size: 'med',
        disposition: 1,
        level: 5,
        hp: { value: 30, max: 30 },
        ac: 16,
        abilities: { str: 14, dex: 12, con: 13, int: 10, wis: 11, cha: 15 }
      });
      const wrongType = createMockActor({
        id: 'wrong-type',
        name: 'Brave Beast',
        type: 'npc'
      });
      const wrongName = createMockActor({
        id: 'wrong-name',
        name: 'Coward',
        type: 'character',
        hasPlayerOwner: true,
        creatureType: 'humanoid',
        size: 'med',
        disposition: 1,
        level: 5,
        hp: { value: 30, max: 30 },
        ac: 16,
        abilities: { str: 14, dex: 12, con: 13, int: 10, wis: 11, cha: 15 }
      });

      const game = makeGame({ actors: [matching, wrongType, wrongName] });
      const handler = createFilterActorsHandler({
        gameProvider: { getGame: () => game }
      });

      const result = await handler({
        name: 'brave',
        type: ['character'],
        creatureType: ['humanoid'],
        size: ['med'],
        disposition: ['friendly'],
        hasPlayerOwner: true,
        level: { min: 1, max: 10 },
        maxHp: { min: 1 },
        currentHp: { min: 1 },
        ac: { min: 10 },
        abilities: { str: { min: 10 } }
      });

      expect(result.total).toBe(1);
      expect(result.results).toEqual([{ id: 'match', name: 'Brave Hero' }]);
    });
  });

  describe('pagination', () => {
    it('returns paginated slice with limit/offset and hasMore=true', async () => {
      const actors: FoundryActor[] = [];
      for (let i = 1; i <= 5; i++) {
        actors.push(
          createMockActor({ id: `a${i}`, name: `Actor ${i}`, type: 'npc' })
        );
      }
      const game = makeGame({ actors });
      const handler = createFilterActorsHandler({
        gameProvider: { getGame: () => game }
      });

      const result = await handler({ limit: 2, offset: 1 });

      expect(result.results.length).toBe(2);
      expect(result.total).toBe(5);
      expect(result.hasMore).toBe(true);
    });

    it('returns hasMore=false when slice reaches the end', async () => {
      const actors: FoundryActor[] = [
        createMockActor({ id: 'a1', name: 'One', type: 'npc' }),
        createMockActor({ id: 'a2', name: 'Two', type: 'npc' }),
        createMockActor({ id: 'a3', name: 'Three', type: 'npc' })
      ];
      const game = makeGame({ actors });
      const handler = createFilterActorsHandler({
        gameProvider: { getGame: () => game }
      });

      const result = await handler({ limit: 10, offset: 0 });

      expect(result.results.length).toBe(3);
      expect(result.total).toBe(3);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('sorting', () => {
    it('sorts by name ASC', async () => {
      const game = makeGame({
        actors: [
          createMockActor({ id: 'a1', name: 'Charlie', type: 'npc' }),
          createMockActor({ id: 'a2', name: 'Alice', type: 'npc' }),
          createMockActor({ id: 'a3', name: 'Bob', type: 'npc' })
        ]
      });
      const handler = createFilterActorsHandler({
        gameProvider: { getGame: () => game }
      });

      const result = await handler({});

      expect(result.results.map((r) => r.name)).toEqual([
        'Alice',
        'Bob',
        'Charlie'
      ]);
    });
  });

  describe('folder filter', () => {
    it('filters actors by folder id', async () => {
      const targetFolder = makeFolder({ id: 'f1', name: 'Heroes', type: 'Actor' });
      const game = makeGame({
        actors: [
          createMockActor({ id: 'a1', name: 'In Folder', type: 'npc', folderId: 'f1' }),
          createMockActor({ id: 'a2', name: 'Outside', type: 'npc', folderId: 'f2' }),
          createMockActor({ id: 'a3', name: 'Rootless', type: 'npc', folderId: null })
        ],
        folders: [targetFolder],
        folderById: new Map([['f1', targetFolder]])
      });
      const handler = createFilterActorsHandler({
        gameProvider: { getGame: () => game }
      });

      const result = await handler({ folder: { id: 'f1' } });

      expect(result.total).toBe(1);
      expect(result.results).toEqual([{ id: 'a1', name: 'In Folder' }]);
    });

    it('returns empty when folder reference does not match', async () => {
      const game = makeGame({
        actors: [
          createMockActor({ id: 'a1', name: 'A', type: 'npc', folderId: 'f1' })
        ],
        folders: [],
        folderById: new Map()
      });
      const handler = createFilterActorsHandler({
        gameProvider: { getGame: () => game }
      });

      const result = await handler({ folder: { id: 'unknown' } });

      expect(result.total).toBe(0);
      expect(result.results).toEqual([]);
    });
  });

  describe('end-to-end JSON shape (WebSocket-like)', () => {
    it('handles a full JSON-shaped params object as the wire would deliver', async () => {
      const game = makeGame({
        actors: [
          createMockActor({ id: 'a1', name: 'Wire Hero', type: 'character' })
        ]
      });
      const handler = createFilterActorsHandler({
        gameProvider: { getGame: () => game }
      });

      const wireParams: FilterActorsParams = JSON.parse(
        JSON.stringify({
          name: 'wire',
          type: ['character'],
          limit: 10,
          offset: 0
        })
      );

      const result = await handler(wireParams);

      expect(result).toEqual({
        results: [{ id: 'a1', name: 'Wire Hero' }],
        total: 1,
        hasMore: false
      });
    });
  });
});
