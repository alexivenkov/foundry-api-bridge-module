import { dnd5eFilterCompendiumItemsHandler } from '../Dnd5eFilterCompendiumItemsHandler';

interface MockDoc {
  id: string;
  uuid: string;
  name: string;
  type: string;
  folder: null;
  system: Record<string, unknown>;
}

function makeDoc(overrides: Partial<MockDoc> = {}): MockDoc {
  return {
    id: 's1',
    uuid: 'Compendium.dnd5e.spells.Item.s1',
    name: 'Fireball',
    type: 'spell',
    folder: null,
    system: { level: 3, school: 'evo' },
    ...overrides
  };
}

interface MockPack {
  collection: string;
  metadata: { type: string };
  getDocuments: jest.Mock;
}

function makePack(collection: string, type: string, docs: MockDoc[]): MockPack {
  return { collection, metadata: { type }, getDocuments: jest.fn(async () => docs) };
}

function setGame(systemId: string, packs: MockPack[]): void {
  (globalThis as Record<string, unknown>)['game'] = {
    system: { id: systemId },
    packs: {
      get: (id: string): MockPack | undefined => packs.find(p => p.collection === id),
      forEach: (fn: (p: MockPack) => void): void => {
        packs.forEach(fn);
      }
    }
  };
}

function clearGame(): void {
  delete (globalThis as Record<string, unknown>)['game'];
}

describe('dnd5eFilterCompendiumItemsHandler', () => {
  afterEach(clearGame);

  it('throws UnsupportedOperationError in a non-dnd5e world', async () => {
    setGame('pf2e', []);

    await expect(dnd5eFilterCompendiumItemsHandler({})).rejects.toThrow(
      "Operation 'dnd5e/filter-compendium-items' is not supported by game system 'pf2e'"
    );
  });

  it('filters item packs by spell level and school with enriched entries', async () => {
    const spells = makePack('dnd5e.spells', 'Item', [
      makeDoc(),
      makeDoc({
        id: 's2',
        uuid: 'Compendium.dnd5e.spells.Item.s2',
        name: 'Wish',
        system: { level: 9, school: 'con' }
      })
    ]);
    setGame('dnd5e', [spells]);

    const result = await dnd5eFilterCompendiumItemsHandler({
      type: ['spell'],
      spellLevel: { min: 1, max: 3 },
      spellSchool: ['evocation']
    });

    expect(result).toEqual({
      results: [
        {
          id: 's1',
          name: 'Fireball',
          packId: 'dnd5e.spells',
          uuid: 'Compendium.dnd5e.spells.Item.s1'
        }
      ],
      total: 1,
      hasMore: false
    });
  });

  it('surfaces wrong-type pack errors for explicit packIds', async () => {
    const monsters = makePack('dnd5e.monsters', 'Actor', []);
    setGame('dnd5e', [monsters]);

    await expect(
      dnd5eFilterCompendiumItemsHandler({ packIds: ['dnd5e.monsters'] })
    ).rejects.toThrow('Compendium pack is not an Item pack: dnd5e.monsters');
  });

  it('throws a formatted validation error for bad params', async () => {
    setGame('dnd5e', []);

    await expect(
      dnd5eFilterCompendiumItemsHandler({ spellLevel: { min: 12 } })
    ).rejects.toThrow('spellLevel');
  });
});
