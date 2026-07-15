import { dnd5eFilterCompendiumActorsHandler } from '../Dnd5eFilterCompendiumActorsHandler';

interface MockDoc {
  id: string;
  uuid: string;
  name: string;
  type: string;
  hasPlayerOwner: boolean;
  folder: null;
  system: Record<string, unknown>;
  prototypeToken?: { disposition?: number };
}

function makeDoc(overrides: Partial<MockDoc> = {}): MockDoc {
  return {
    id: 'm1',
    uuid: 'Compendium.dnd5e.monsters.Actor.m1',
    name: 'Goblin',
    type: 'npc',
    hasPlayerOwner: false,
    folder: null,
    system: {
      details: { cr: 0.25, type: { value: 'humanoid' } },
      traits: { size: 'sm' },
      attributes: { hp: { value: 7, max: 7 }, ac: { value: 15 } }
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

describe('dnd5eFilterCompendiumActorsHandler', () => {
  afterEach(clearGame);

  it('throws UnsupportedOperationError in a non-dnd5e world', async () => {
    setGame('pf2e', []);

    await expect(dnd5eFilterCompendiumActorsHandler({})).rejects.toThrow(
      "Operation 'dnd5e/filter-compendium-actors' is not supported by game system 'pf2e'"
    );
  });

  it('filters actor packs and returns enriched entries', async () => {
    const monsters = makePack('dnd5e.monsters', 'Actor', [
      makeDoc(),
      makeDoc({
        id: 'm2',
        uuid: 'Compendium.dnd5e.monsters.Actor.m2',
        name: 'Adult Red Dragon',
        system: {
          details: { cr: 17, type: { value: 'dragon' } },
          traits: { size: 'huge' },
          attributes: { hp: { value: 256, max: 256 }, ac: { value: 19 } }
        }
      })
    ]);
    setGame('dnd5e', [monsters]);

    const result = await dnd5eFilterCompendiumActorsHandler({
      cr: { min: 10, max: 20 }
    });

    expect(result).toEqual({
      results: [
        {
          id: 'm2',
          name: 'Adult Red Dragon',
          packId: 'dnd5e.monsters',
          uuid: 'Compendium.dnd5e.monsters.Actor.m2'
        }
      ],
      total: 1,
      hasMore: false
    });
  });

  it('honors explicit packIds and surfaces pack errors', async () => {
    const monsters = makePack('dnd5e.monsters', 'Actor', [makeDoc()]);
    setGame('dnd5e', [monsters]);

    const scoped = await dnd5eFilterCompendiumActorsHandler({
      packIds: ['dnd5e.monsters']
    });
    expect(scoped.total).toBe(1);

    await expect(
      dnd5eFilterCompendiumActorsHandler({ packIds: ['ghost.pack'] })
    ).rejects.toThrow('Pack not found: ghost.pack');
  });

  it('throws a formatted validation error for bad params', async () => {
    setGame('dnd5e', []);

    await expect(
      dnd5eFilterCompendiumActorsHandler({ type: ['dragonkin'] })
    ).rejects.toThrow("type.0: unknown actorType: 'dragonkin'");
  });

  it('returns empty result when the world has no actor packs', async () => {
    setGame('dnd5e', [makePack('dnd5e.items', 'Item', [])]);

    const result = await dnd5eFilterCompendiumActorsHandler({});
    expect(result).toEqual({ results: [], total: 0, hasMore: false });
  });
});
