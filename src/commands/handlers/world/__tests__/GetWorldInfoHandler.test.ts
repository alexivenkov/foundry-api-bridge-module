import { getWorldInfoHandler } from '../GetWorldInfoHandler';
import type { FoundryGame, FoundryPack } from '../worldTypes';

function createMockCollection<T>(items: T[] = []): { size: number; forEach: jest.Mock } {
  return {
    size: items.length,
    forEach: jest.fn((fn: (item: T) => void) => {
      items.forEach(fn);
    })
  };
}

function createMockPack(overrides?: Partial<FoundryPack>): FoundryPack {
  return {
    collection: 'dnd5e.monsters',
    metadata: {
      label: 'Monsters',
      type: 'Actor',
      system: 'dnd5e'
    },
    index: { size: 350 },
    ...overrides
  };
}

function createMockGame(overrides?: Partial<FoundryGame>): FoundryGame {
  return {
    world: { id: 'test-world', title: 'Test Campaign' },
    system: { id: 'dnd5e', version: '4.3.0' },
    version: '12.331',
    journal: createMockCollection(),
    actors: createMockCollection(),
    items: createMockCollection(),
    scenes: createMockCollection(),
    packs: createMockCollection<FoundryPack>(),
    ...overrides
  };
}

function setGame(game: FoundryGame): void {
  (globalThis as Record<string, unknown>)['game'] = game;
}

function clearGame(): void {
  delete (globalThis as Record<string, unknown>)['game'];
}

describe('getWorldInfoHandler', () => {
  afterEach(() => {
    clearGame();
  });

  it('should return full world info with all fields populated', async () => {
    setGame(createMockGame({
      journal: createMockCollection([1, 2, 3]),
      actors: createMockCollection([1, 2]),
      items: createMockCollection([1, 2, 3, 4]),
      scenes: createMockCollection([1])
    }));

    const result = await getWorldInfoHandler({} as Record<string, never>);

    expect(result.world).toEqual({
      id: 'test-world',
      title: 'Test Campaign',
      system: 'dnd5e',
      systemVersion: '4.3.0',
      foundryVersion: '12.331'
    });
    expect(result.counts).toEqual({
      journals: 3,
      actors: 2,
      items: 4,
      scenes: 1
    });
    expect(result.compendiumMeta).toEqual([]);
  });

  it('should fallback to empty strings when game.world is undefined', async () => {
    setGame(createMockGame({ world: undefined }));

    const result = await getWorldInfoHandler({} as Record<string, never>);

    expect(result.world.id).toBe('');
    expect(result.world.title).toBe('');
  });

  it('should fallback to empty strings when game.system is undefined', async () => {
    setGame(createMockGame({ system: undefined }));

    const result = await getWorldInfoHandler({} as Record<string, never>);

    expect(result.world.system).toBe('');
    expect(result.world.systemVersion).toBe('');
  });

  it('should fallback to empty string when game.version is undefined', async () => {
    setGame(createMockGame({ version: undefined }));

    const result = await getWorldInfoHandler({} as Record<string, never>);

    expect(result.world.foundryVersion).toBe('');
  });

  it('should return zero counts when collections are undefined', async () => {
    setGame(createMockGame({
      journal: undefined,
      actors: undefined,
      items: undefined,
      scenes: undefined
    }));

    const result = await getWorldInfoHandler({} as Record<string, never>);

    expect(result.counts).toEqual({
      journals: 0,
      actors: 0,
      items: 0,
      scenes: 0
    });
  });

  it('should return zero counts for empty collections', async () => {
    setGame(createMockGame());

    const result = await getWorldInfoHandler({} as Record<string, never>);

    expect(result.counts).toEqual({
      journals: 0,
      actors: 0,
      items: 0,
      scenes: 0
    });
  });

  it('should return empty compendiumMeta when packs is undefined', async () => {
    setGame(createMockGame({ packs: undefined }));

    const result = await getWorldInfoHandler({} as Record<string, never>);

    expect(result.compendiumMeta).toEqual([]);
  });

  it('should collect multiple compendium packs', async () => {
    const packs = [
      createMockPack({
        collection: 'dnd5e.monsters',
        metadata: { label: 'Monsters', type: 'Actor', system: 'dnd5e' },
        index: { size: 350 }
      }),
      createMockPack({
        collection: 'dnd5e.spells',
        metadata: { label: 'Spells', type: 'Item', system: 'dnd5e' },
        index: { size: 500 }
      }),
      createMockPack({
        collection: 'world.custom-tables',
        metadata: { label: 'Custom Tables', type: 'RollTable', system: undefined },
        index: { size: 5 }
      })
    ];

    setGame(createMockGame({ packs: createMockCollection(packs) }));

    const result = await getWorldInfoHandler({} as Record<string, never>);

    expect(result.compendiumMeta).toHaveLength(3);
    expect(result.compendiumMeta[0]).toEqual({
      id: 'dnd5e.monsters',
      label: 'Monsters',
      type: 'Actor',
      system: 'dnd5e',
      count: 350
    });
    expect(result.compendiumMeta[1]).toEqual({
      id: 'dnd5e.spells',
      label: 'Spells',
      type: 'Item',
      system: 'dnd5e',
      count: 500
    });
    expect(result.compendiumMeta[2]).toEqual({
      id: 'world.custom-tables',
      label: 'Custom Tables',
      type: 'RollTable',
      system: '',
      count: 5
    });
  });

  it('should fallback system to empty string when pack metadata system is undefined', async () => {
    const pack = createMockPack({
      metadata: { label: 'Custom', type: 'Actor', system: undefined }
    });

    setGame(createMockGame({ packs: createMockCollection([pack]) }));

    const result = await getWorldInfoHandler({} as Record<string, never>);

    expect(result.compendiumMeta[0]?.system).toBe('');
  });

  it('should return count 0 for pack with empty index', async () => {
    const pack = createMockPack({ index: { size: 0 } });

    setGame(createMockGame({ packs: createMockCollection([pack]) }));

    const result = await getWorldInfoHandler({} as Record<string, never>);

    expect(result.compendiumMeta[0]?.count).toBe(0);
  });

  it('should handle completely bare game object', async () => {
    setGame({
      world: undefined,
      system: undefined,
      version: undefined,
      journal: undefined,
      actors: undefined,
      items: undefined,
      scenes: undefined,
      packs: undefined
    });

    const result = await getWorldInfoHandler({} as Record<string, never>);

    expect(result.world).toEqual({
      id: '',
      title: '',
      system: '',
      systemVersion: '',
      foundryVersion: ''
    });
    expect(result.counts).toEqual({
      journals: 0,
      actors: 0,
      items: 0,
      scenes: 0
    });
    expect(result.compendiumMeta).toEqual([]);
  });
});
