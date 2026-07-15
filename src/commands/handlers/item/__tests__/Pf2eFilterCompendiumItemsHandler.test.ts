import { pf2eFilterCompendiumItemsHandler } from '../Pf2eFilterCompendiumItemsHandler';

interface MockDoc {
  id: string;
  uuid: string;
  name: string;
  type: string;
  system: Record<string, unknown>;
}

function makeSpell(overrides: Partial<MockDoc> = {}): MockDoc {
  return {
    id: 's1',
    uuid: 'Compendium.pf2e.spells-srd.Item.s1',
    name: 'Fireball',
    type: 'spell',
    system: {
      level: { value: 3 },
      traits: { value: ['concentrate'], rarity: 'common', traditions: ['arcane', 'primal'] }
    },
    ...overrides
  };
}

interface MockPack {
  collection: string;
  metadata: { type: string };
  getDocuments: jest.Mock;
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

describe('pf2eFilterCompendiumItemsHandler', () => {
  afterEach(clearGame);

  it('throws UnsupportedOperationError in a non-pf2e world', async () => {
    setGame('dnd5e', []);

    await expect(pf2eFilterCompendiumItemsHandler({})).rejects.toThrow(
      "Operation 'pf2e/filter-compendium-items' is not supported by game system 'dnd5e'"
    );
  });

  it('filters spells by level and tradition', async () => {
    const spells: MockPack = {
      collection: 'pf2e.spells-srd',
      metadata: { type: 'Item' },
      getDocuments: jest.fn(async () => [
        makeSpell(),
        makeSpell({
          id: 's2',
          uuid: 'Compendium.pf2e.spells-srd.Item.s2',
          name: 'Heal',
          system: {
            level: { value: 1 },
            traits: { value: ['healing'], rarity: 'common', traditions: ['divine', 'primal'] }
          }
        })
      ])
    };
    setGame('pf2e', [spells]);

    const result = await pf2eFilterCompendiumItemsHandler({
      type: ['spell'],
      level: { min: 2, max: 4 },
      traditions: ['arcane']
    });

    expect(result.results).toEqual([
      {
        id: 's1',
        name: 'Fireball',
        level: 3,
        packId: 'pf2e.spells-srd',
        uuid: 'Compendium.pf2e.spells-srd.Item.s1'
      }
    ]);
    expect(result.total).toBe(1);
  });

  it('surfaces wrong-type pack errors for explicit packIds', async () => {
    const bestiary: MockPack = {
      collection: 'pf2e.monsters',
      metadata: { type: 'Actor' },
      getDocuments: jest.fn(async () => [])
    };
    setGame('pf2e', [bestiary]);

    await expect(
      pf2eFilterCompendiumItemsHandler({ packIds: ['pf2e.monsters'] })
    ).rejects.toThrow('Compendium pack is not an Item pack: pf2e.monsters');
  });
});
