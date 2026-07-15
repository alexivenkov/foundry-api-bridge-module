import { pf2eFilterCompendiumActorsHandler } from '../Pf2eFilterCompendiumActorsHandler';

interface MockDoc {
  id: string;
  uuid: string;
  name: string;
  type: string;
  system: Record<string, unknown>;
}

function makeDoc(overrides: Partial<MockDoc> = {}): MockDoc {
  return {
    id: 'm1',
    uuid: 'Compendium.pf2e.monsters.Actor.m1',
    name: 'Zombie Shambler',
    type: 'npc',
    system: {
      details: { level: { value: 1 } },
      traits: { value: ['undead', 'mindless'], rarity: 'common', size: { value: 'med' } },
      attributes: { hp: { value: 20, max: 20 }, ac: { value: 13 } }
    },
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

describe('pf2eFilterCompendiumActorsHandler', () => {
  afterEach(clearGame);

  it('throws UnsupportedOperationError in a non-pf2e world', async () => {
    setGame('dnd5e', []);

    await expect(pf2eFilterCompendiumActorsHandler({})).rejects.toThrow(
      "Operation 'pf2e/filter-compendium-actors' is not supported by game system 'dnd5e'"
    );
  });

  it('filters bestiaries by level and traits, returning level-bearing entries', async () => {
    const bestiary = makePack('pf2e.monsters', 'Actor', [
      makeDoc(),
      makeDoc({
        id: 'm2',
        uuid: 'Compendium.pf2e.monsters.Actor.m2',
        name: 'Ancient Red Dragon',
        system: {
          details: { level: { value: 19 } },
          traits: { value: ['dragon', 'fire'], rarity: 'uncommon', size: { value: 'grg' } },
          attributes: { hp: { value: 425, max: 425 }, ac: { value: 45 } }
        }
      })
    ]);
    setGame('pf2e', [bestiary]);

    const result = await pf2eFilterCompendiumActorsHandler({
      level: { min: 0, max: 4 },
      traits: ['undead']
    });

    expect(result).toEqual({
      results: [
        {
          id: 'm1',
          name: 'Zombie Shambler',
          level: 1,
          packId: 'pf2e.monsters',
          uuid: 'Compendium.pf2e.monsters.Actor.m1'
        }
      ],
      total: 1,
      hasMore: false
    });
  });

  it('honors explicit packIds and surfaces pack errors', async () => {
    setGame('pf2e', [makePack('pf2e.monsters', 'Actor', [makeDoc()])]);

    await expect(
      pf2eFilterCompendiumActorsHandler({ packIds: ['ghost'] })
    ).rejects.toThrow('Pack not found: ghost');
  });

  it('throws a formatted validation error for unknown actor types', async () => {
    setGame('pf2e', []);

    await expect(
      pf2eFilterCompendiumActorsHandler({ type: ['monster'] })
    ).rejects.toThrow(/type\.0/);
  });
});
