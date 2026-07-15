import { CompendiumItemRepository } from '../CompendiumItemRepository';
import { CompendiumPackNotFoundError, CompendiumPackTypeError } from '../compendiumErrors';
import { FoundryItemMapper } from '../FoundryItemMapper';
import type {
  CompendiumItemFilteringGameProvider,
  FoundryCompendiumItemDocument,
  FoundryItemCompendiumPack
} from '../foundryCompendiumPackTypes';

function makeDoc(
  overrides: Partial<FoundryCompendiumItemDocument> = {}
): FoundryCompendiumItemDocument {
  return {
    id: 'w1',
    uuid: 'Compendium.dnd5e.items.Item.w1',
    name: 'Longsword',
    type: 'weapon',
    folder: null,
    system: {
      rarity: 'common',
      weight: { value: 3 },
      price: { value: 15, denomination: 'gp' }
    },
    ...overrides
  };
}

function makePack(
  collection: string,
  type: string,
  docs: FoundryCompendiumItemDocument[]
): FoundryItemCompendiumPack {
  return {
    collection,
    metadata: { type },
    getDocuments: jest.fn(async () => docs)
  };
}

function makeRepo(
  packs: FoundryItemCompendiumPack[] | undefined,
  packIds?: readonly string[]
): CompendiumItemRepository {
  const provider: CompendiumItemFilteringGameProvider = {
    getGame: () => ({
      packs:
        packs !== undefined
          ? {
              get: (id: string) => packs.find(p => p.collection === id),
              forEach: (fn: (p: FoundryItemCompendiumPack) => void) => {
                packs.forEach(fn);
              }
            }
          : undefined
    })
  };
  return new CompendiumItemRepository(provider, new FoundryItemMapper(), packIds);
}

describe('CompendiumItemRepository', () => {
  it('maps documents through FoundryItemMapper and enriches with packId/uuid', async () => {
    const pack = makePack('dnd5e.items', 'Item', [makeDoc()]);

    const snapshots = await makeRepo([pack]).findAll();

    expect(snapshots).toHaveLength(1);
    const sword = snapshots[0];
    expect(sword?.packId).toBe('dnd5e.items');
    expect(sword?.uuid).toBe('Compendium.dnd5e.items.Item.w1');
    expect(sword?.weight).toBe(3);
    expect(sword?.priceGp).toBe(15);
    expect(sword?.rarity).toBe('common');
  });

  it('discovers only Item packs when packIds omitted', async () => {
    const items = makePack('dnd5e.items', 'Item', [makeDoc()]);
    const monsters = makePack('dnd5e.monsters', 'Actor', []);

    const snapshots = await makeRepo([items, monsters]).findAll();

    expect(snapshots.map(s => s.packId)).toEqual(['dnd5e.items']);
    expect(monsters.getDocuments).not.toHaveBeenCalled();
  });

  it('handles missing packs collection and empty explicit list', async () => {
    expect(await makeRepo(undefined).findAll()).toEqual([]);
    const pack = makePack('dnd5e.items', 'Item', [makeDoc()]);
    expect(await makeRepo([pack], []).findAll()).toEqual([]);
  });

  it('throws for explicit packIds when the packs collection is undefined', async () => {
    await expect(makeRepo(undefined, ['dnd5e.items']).findAll()).rejects.toThrow(
      'Pack not found: dnd5e.items'
    );
  });

  it('throws loudly for unknown or wrong-type explicit packs', async () => {
    const monsters = makePack('dnd5e.monsters', 'Actor', []);
    await expect(makeRepo([monsters], ['ghost']).findAll()).rejects.toThrow(
      CompendiumPackNotFoundError
    );
    await expect(makeRepo([monsters], ['dnd5e.monsters']).findAll()).rejects.toThrow(
      CompendiumPackTypeError
    );
    await expect(makeRepo([monsters], ['dnd5e.monsters']).findAll()).rejects.toThrow(
      'Compendium pack is not an Item pack: dnd5e.monsters'
    );
  });
});
