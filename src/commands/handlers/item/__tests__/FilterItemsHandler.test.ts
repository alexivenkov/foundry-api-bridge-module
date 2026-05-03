import type { FilterItemsParams } from '@/commands/types';
import type {
  FoundryItem,
  FoundryItemGameGlobals
} from '@/filtering/items/infrastructure';
import type { FoundryFolderDocument } from '@/filtering/shared/infrastructure';

import { createFilterItemsHandler } from '../FilterItemsHandler';

interface MockItemOverrides {
  id?: string;
  name?: string;
  type?: string;
  folderId?: string | null;
  rarity?: string;
  identified?: boolean;
  weight?: number | { value: number };
  price?: number | { value: number; denomination?: string };
  attunement?: string | number | boolean | { required: boolean };
  level?: number;
  school?: string;
  activities?: Record<string, unknown> | Map<string, unknown>;
}

function createMockItem(o: MockItemOverrides = {}): FoundryItem {
  const folder =
    o.folderId !== undefined && o.folderId !== null ? { id: o.folderId } : null;
  const system: Record<string, unknown> = {};
  if (o.rarity !== undefined) system['rarity'] = o.rarity;
  if (o.identified !== undefined) system['identified'] = o.identified;
  if (o.weight !== undefined) system['weight'] = o.weight;
  if (o.price !== undefined) system['price'] = o.price;
  if (o.attunement !== undefined) system['attunement'] = o.attunement;
  if (o.level !== undefined) system['level'] = o.level;
  if (o.school !== undefined) system['school'] = o.school;
  if (o.activities !== undefined) system['activities'] = o.activities;

  return {
    id: o.id ?? 'item-1',
    name: o.name ?? 'Test Item',
    type: o.type ?? 'weapon',
    folder,
    system
  } as FoundryItem;
}

interface MakeGameOptions {
  items?: readonly FoundryItem[];
  folders?: readonly FoundryFolderDocument[];
  folderById?: Map<string, FoundryFolderDocument>;
}

function makeGame(opts: MakeGameOptions = {}): FoundryItemGameGlobals {
  const folderById = opts.folderById ?? new Map<string, FoundryFolderDocument>();
  return {
    items: { contents: opts.items ?? [] },
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
    type: o.type ?? 'Item',
    parent: null,
    getSubfolders: () => []
  };
}

describe('FilterItemsHandler', () => {
  describe('input validation', () => {
    it('throws Error with formatted message when limit is out of range', async () => {
      const game = makeGame();
      const handler = createFilterItemsHandler({
        gameProvider: { getGame: () => game }
      });

      await expect(
        handler({ limit: 250 } as FilterItemsParams)
      ).rejects.toThrow(/limit/);
    });

    it('throws Error when offset is negative', async () => {
      const game = makeGame();
      const handler = createFilterItemsHandler({
        gameProvider: { getGame: () => game }
      });

      await expect(
        handler({ offset: -5 } as FilterItemsParams)
      ).rejects.toThrow(/offset/);
    });

    it('throws Error when type contains an unknown value', async () => {
      const game = makeGame();
      const handler = createFilterItemsHandler({
        gameProvider: { getGame: () => game }
      });

      await expect(
        handler({ type: ['invalid-type' as 'weapon'] } as FilterItemsParams)
      ).rejects.toThrow();
    });

    it('throws Error when rarity contains an unknown value', async () => {
      const game = makeGame();
      const handler = createFilterItemsHandler({
        gameProvider: { getGame: () => game }
      });

      await expect(
        handler({ rarity: ['mythic' as 'common'] } as FilterItemsParams)
      ).rejects.toThrow();
    });

    it('throws Error when spellLevel is out of range', async () => {
      const game = makeGame();
      const handler = createFilterItemsHandler({
        gameProvider: { getGame: () => game }
      });

      await expect(
        handler({ spellLevel: { max: 10 } } as FilterItemsParams)
      ).rejects.toThrow();
    });
  });

  describe('happy path', () => {
    it('returns empty result for an empty world', async () => {
      const game = makeGame({ items: [] });
      const handler = createFilterItemsHandler({
        gameProvider: { getGame: () => game }
      });

      const result = await handler({});
      expect(result).toEqual({ results: [], total: 0, hasMore: false });
    });

    it('returns all items with sorted result and correct shape', async () => {
      const game = makeGame({
        items: [
          createMockItem({ id: 'i1', name: 'Bow', type: 'weapon' }),
          createMockItem({ id: 'i2', name: 'Arrow', type: 'weapon' })
        ]
      });
      const handler = createFilterItemsHandler({
        gameProvider: { getGame: () => game }
      });

      const result = await handler({});
      expect(result.total).toBe(2);
      expect(result.hasMore).toBe(false);
      expect(result.results).toEqual([
        { id: 'i2', name: 'Arrow' },
        { id: 'i1', name: 'Bow' }
      ]);
    });
  });

  describe('filtering', () => {
    it('filters by item type', async () => {
      const game = makeGame({
        items: [
          createMockItem({ id: 'i1', name: 'Sword', type: 'weapon' }),
          createMockItem({ id: 'i2', name: 'Fireball', type: 'spell', level: 3, school: 'evo' }),
          createMockItem({ id: 'i3', name: 'Cask', type: 'container' })
        ]
      });
      const handler = createFilterItemsHandler({
        gameProvider: { getGame: () => game }
      });

      const result = await handler({ type: ['spell'] });
      expect(result.total).toBe(1);
      expect(result.results).toEqual([{ id: 'i2', name: 'Fireball' }]);
    });

    it('filters by rarity (camelCase veryRare)', async () => {
      const game = makeGame({
        items: [
          createMockItem({ id: 'i1', name: 'Common', rarity: 'common' }),
          createMockItem({ id: 'i2', name: 'VR Sword', rarity: 'veryRare' }),
          createMockItem({ id: 'i3', name: 'VR Shield', rarity: 'very rare' })
        ]
      });
      const handler = createFilterItemsHandler({
        gameProvider: { getGame: () => game }
      });

      const result = await handler({ rarity: ['veryRare'] });
      expect(result.total).toBe(2);
      expect(result.results.map((r) => r.id).sort()).toEqual(['i2', 'i3']);
    });

    it('filters by name substring (case-insensitive)', async () => {
      const game = makeGame({
        items: [
          createMockItem({ id: 'i1', name: 'Health Potion' }),
          createMockItem({ id: 'i2', name: 'Mana Potion' }),
          createMockItem({ id: 'i3', name: 'Sword' })
        ]
      });
      const handler = createFilterItemsHandler({
        gameProvider: { getGame: () => game }
      });

      const result = await handler({ name: 'POTION' });
      expect(result.total).toBe(2);
      expect(result.results.map((r) => r.id).sort()).toEqual(['i1', 'i2']);
    });

    it('filters spells by level range', async () => {
      const game = makeGame({
        items: [
          createMockItem({ id: 's1', name: 'Cantrip', type: 'spell', level: 0, school: 'evo' }),
          createMockItem({ id: 's2', name: 'Magic Missile', type: 'spell', level: 1, school: 'evo' }),
          createMockItem({ id: 's3', name: 'Fireball', type: 'spell', level: 3, school: 'evo' })
        ]
      });
      const handler = createFilterItemsHandler({
        gameProvider: { getGame: () => game }
      });

      const result = await handler({ spellLevel: { min: 1, max: 3 } });
      expect(result.total).toBe(2);
      expect(result.results.map((r) => r.id).sort()).toEqual(['s2', 's3']);
    });

    it('filters by attunement (boolean form)', async () => {
      const game = makeGame({
        items: [
          createMockItem({ id: 'i1', name: 'Ring', attunement: 'required' }),
          createMockItem({ id: 'i2', name: 'Sword', attunement: 'none' }),
          createMockItem({ id: 'i3', name: 'Cloak', attunement: { required: true } })
        ]
      });
      const handler = createFilterItemsHandler({
        gameProvider: { getGame: () => game }
      });

      const result = await handler({ requiresAttunement: true });
      expect(result.total).toBe(2);
      expect(result.results.map((r) => r.id).sort()).toEqual(['i1', 'i3']);
    });

    it('filters by isContainer', async () => {
      const game = makeGame({
        items: [
          createMockItem({ id: 'i1', name: 'Sword', type: 'weapon' }),
          createMockItem({ id: 'i2', name: 'Backpack', type: 'container' })
        ]
      });
      const handler = createFilterItemsHandler({
        gameProvider: { getGame: () => game }
      });

      const result = await handler({ isContainer: true });
      expect(result.total).toBe(1);
      expect(result.results).toEqual([{ id: 'i2', name: 'Backpack' }]);
    });

    it('combines multiple filters', async () => {
      const matching = createMockItem({
        id: 'match',
        name: 'Magic Sword',
        type: 'weapon',
        rarity: 'rare',
        identified: true,
        attunement: 'required',
        weight: 3,
        price: { value: 100, denomination: 'gp' },
        activities: { 'a-1': {} }
      });
      const wrongType = createMockItem({
        id: 'wrong-type',
        name: 'Magic Spell',
        type: 'spell',
        level: 1,
        school: 'evo'
      });
      const wrongRarity = createMockItem({
        id: 'wrong-rarity',
        name: 'Magic Shield',
        type: 'weapon',
        rarity: 'common'
      });

      const game = makeGame({ items: [matching, wrongType, wrongRarity] });
      const handler = createFilterItemsHandler({
        gameProvider: { getGame: () => game }
      });

      const result = await handler({
        name: 'magic',
        type: ['weapon'],
        rarity: ['rare'],
        identified: true,
        requiresAttunement: true,
        weight: { min: 0, max: 10 },
        price: { min: 0, max: 1000 }
      });

      expect(result.total).toBe(1);
      expect(result.results).toEqual([{ id: 'match', name: 'Magic Sword' }]);
    });
  });

  describe('pagination', () => {
    it('returns paginated slice with limit/offset and hasMore=true', async () => {
      const items: FoundryItem[] = [];
      for (let i = 1; i <= 5; i++) {
        items.push(createMockItem({ id: `i${i}`, name: `Item ${i}` }));
      }
      const game = makeGame({ items });
      const handler = createFilterItemsHandler({
        gameProvider: { getGame: () => game }
      });

      const result = await handler({ limit: 2, offset: 1 });
      expect(result.results).toHaveLength(2);
      expect(result.total).toBe(5);
      expect(result.hasMore).toBe(true);
    });

    it('returns hasMore=false when slice reaches the end', async () => {
      const items: FoundryItem[] = [
        createMockItem({ id: 'i1', name: 'One' }),
        createMockItem({ id: 'i2', name: 'Two' })
      ];
      const game = makeGame({ items });
      const handler = createFilterItemsHandler({
        gameProvider: { getGame: () => game }
      });

      const result = await handler({ limit: 10, offset: 0 });
      expect(result.total).toBe(2);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('sorting', () => {
    it('sorts by name ASC', async () => {
      const game = makeGame({
        items: [
          createMockItem({ id: 'i1', name: 'Charlie' }),
          createMockItem({ id: 'i2', name: 'Alice' }),
          createMockItem({ id: 'i3', name: 'Bob' })
        ]
      });
      const handler = createFilterItemsHandler({
        gameProvider: { getGame: () => game }
      });

      const result = await handler({});
      expect(result.results.map((r) => r.name)).toEqual(['Alice', 'Bob', 'Charlie']);
    });
  });

  describe('folder filter', () => {
    it('filters items by folder id (Item type, not Actor)', async () => {
      const itemFolder = makeFolder({ id: 'fi', name: 'Treasure', type: 'Item' });
      const actorFolder = makeFolder({ id: 'fa', name: 'Treasure', type: 'Actor' });
      const game = makeGame({
        items: [
          createMockItem({ id: 'i1', name: 'In Folder', folderId: 'fi' }),
          createMockItem({ id: 'i2', name: 'Outside', folderId: 'fa' }),
          createMockItem({ id: 'i3', name: 'Rootless', folderId: null })
        ],
        folders: [itemFolder, actorFolder],
        folderById: new Map([
          ['fi', itemFolder],
          ['fa', actorFolder]
        ])
      });
      const handler = createFilterItemsHandler({
        gameProvider: { getGame: () => game }
      });

      const result = await handler({ folder: { id: 'fi' } });
      expect(result.total).toBe(1);
      expect(result.results).toEqual([{ id: 'i1', name: 'In Folder' }]);
    });

    it('returns empty when folder is Actor type only (FoundryFolderResolver guard)', async () => {
      const actorFolder = makeFolder({ id: 'fa', name: 'Treasure', type: 'Actor' });
      const game = makeGame({
        items: [createMockItem({ id: 'i1', name: 'X', folderId: 'fa' })],
        folders: [actorFolder],
        folderById: new Map([['fa', actorFolder]])
      });
      const handler = createFilterItemsHandler({
        gameProvider: { getGame: () => game }
      });

      const result = await handler({ folder: { id: 'fa' } });
      expect(result.total).toBe(0);
    });
  });

  describe('end-to-end JSON shape (WebSocket-like)', () => {
    it('handles a full JSON-shaped params object as the wire would deliver', async () => {
      const game = makeGame({
        items: [
          createMockItem({
            id: 'i1',
            name: 'Wire Sword',
            type: 'weapon',
            rarity: 'rare'
          })
        ]
      });
      const handler = createFilterItemsHandler({
        gameProvider: { getGame: () => game }
      });

      const wireParams: FilterItemsParams = JSON.parse(
        JSON.stringify({
          name: 'wire',
          type: ['weapon'],
          rarity: ['rare'],
          limit: 10,
          offset: 0
        })
      );

      const result = await handler(wireParams);
      expect(result).toEqual({
        results: [{ id: 'i1', name: 'Wire Sword' }],
        total: 1,
        hasMore: false
      });
    });
  });
});
