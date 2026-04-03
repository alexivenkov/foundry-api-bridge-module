import { getCompendiumsHandler } from '../GetCompendiumsHandler';
import type { FoundryPack, FoundryGame } from '../worldTypes';

function createMockCollection<T>(items: T[] = []): { size: number; forEach: jest.Mock } {
  return {
    size: items.length,
    forEach: jest.fn((fn: (item: T) => void) => { items.forEach(fn); })
  };
}

function createMockPack(overrides?: Partial<FoundryPack>): FoundryPack {
  return {
    collection: 'dnd5e.monsters',
    metadata: { label: 'Monsters', type: 'Actor', system: 'dnd5e', packageName: 'dnd5e' },
    index: { size: 350 },
    ...overrides
  };
}

function setGame(packs: FoundryPack[] | undefined): void {
  const game: Partial<FoundryGame> = {
    world: undefined,
    system: undefined,
    version: undefined,
    journal: undefined,
    actors: undefined,
    items: undefined,
    scenes: undefined,
    packs: packs !== undefined ? createMockCollection(packs) : undefined
  };
  (globalThis as Record<string, unknown>)['game'] = game;
}

function clearGame(): void {
  delete (globalThis as Record<string, unknown>)['game'];
}

describe('getCompendiumsHandler', () => {
  afterEach(clearGame);

  it('should return all compendium metadata', async () => {
    setGame([
      createMockPack({ collection: 'dnd5e.monsters', metadata: { label: 'Monsters', type: 'Actor', system: 'dnd5e', packageName: 'dnd5e' }, index: { size: 350 } }),
      createMockPack({ collection: 'dnd5e.spells', metadata: { label: 'Spells', type: 'Item', system: 'dnd5e', packageName: 'dnd5e' }, index: { size: 500 } })
    ]);

    const result = await getCompendiumsHandler({} as Record<string, never>);

    expect(result).toEqual([
      { id: 'dnd5e.monsters', label: 'Monsters', type: 'Actor', system: 'dnd5e', packageName: 'dnd5e', documentCount: 350 },
      { id: 'dnd5e.spells', label: 'Spells', type: 'Item', system: 'dnd5e', packageName: 'dnd5e', documentCount: 500 }
    ]);
  });

  it('should return empty array when packs is undefined', async () => {
    setGame(undefined);

    const result = await getCompendiumsHandler({} as Record<string, never>);

    expect(result).toEqual([]);
  });

  it('should return empty array for empty packs collection', async () => {
    setGame([]);

    const result = await getCompendiumsHandler({} as Record<string, never>);

    expect(result).toEqual([]);
  });

  it('should fallback system to empty string when undefined', async () => {
    setGame([createMockPack({ metadata: { label: 'Custom', type: 'Actor', system: undefined, packageName: 'world' } })]);

    const result = await getCompendiumsHandler({} as Record<string, never>);

    expect(result[0]?.system).toBe('');
  });

  it('should return documentCount 0 for empty index', async () => {
    setGame([createMockPack({ index: { size: 0 } })]);

    const result = await getCompendiumsHandler({} as Record<string, never>);

    expect(result[0]?.documentCount).toBe(0);
  });
});
