import { getActorsHandler } from '../GetActorsHandler';

interface MockActor {
  id: string;
  name: string;
  type: string;
  img: string | undefined;
}

function createMockActor(overrides?: Partial<MockActor>): MockActor {
  return {
    id: 'actor-1',
    name: 'Test Actor',
    type: 'character',
    img: 'tokens/actor.webp',
    ...overrides
  };
}

function setGame(actors: MockActor[]): void {
  (globalThis as Record<string, unknown>)['game'] = {
    actors: {
      forEach: jest.fn((fn: (actor: MockActor) => void) => {
        actors.forEach(fn);
      })
    }
  };
}

function clearGame(): void {
  delete (globalThis as Record<string, unknown>)['game'];
}

describe('getActorsHandler', () => {
  afterEach(() => {
    clearGame();
  });

  it('should return all actors with correct fields', async () => {
    setGame([
      createMockActor({ id: 'a1', name: 'Gandalf', type: 'npc', img: 'tokens/gandalf.webp' }),
      createMockActor({ id: 'a2', name: 'Frodo', type: 'character', img: 'tokens/frodo.webp' }),
      createMockActor({ id: 'a3', name: 'Wagon', type: 'vehicle', img: 'tokens/wagon.webp' })
    ]);

    const result = await getActorsHandler({} as Record<string, never>);

    expect(result).toEqual([
      { id: 'a1', name: 'Gandalf', type: 'npc', img: 'tokens/gandalf.webp' },
      { id: 'a2', name: 'Frodo', type: 'character', img: 'tokens/frodo.webp' },
      { id: 'a3', name: 'Wagon', type: 'vehicle', img: 'tokens/wagon.webp' }
    ]);
  });

  it('should return empty array for empty collection', async () => {
    setGame([]);

    const result = await getActorsHandler({} as Record<string, never>);

    expect(result).toEqual([]);
  });

  it('should fallback img to empty string when undefined', async () => {
    setGame([createMockActor({ id: 'a1', name: 'No Image', img: undefined })]);

    const result = await getActorsHandler({} as Record<string, never>);

    expect(result[0]?.img).toBe('');
  });

  it('should return single actor as array of one', async () => {
    setGame([createMockActor({ id: 'solo', name: 'Solo' })]);

    const result = await getActorsHandler({} as Record<string, never>);

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('solo');
  });

  it('should include all actor types without filtering', async () => {
    setGame([
      createMockActor({ id: 'a1', type: 'character' }),
      createMockActor({ id: 'a2', type: 'npc' }),
      createMockActor({ id: 'a3', type: 'vehicle' }),
      createMockActor({ id: 'a4', type: 'group' })
    ]);

    const result = await getActorsHandler({} as Record<string, never>);

    expect(result).toHaveLength(4);
    const types = result.map(a => a.type);
    expect(types).toEqual(['character', 'npc', 'vehicle', 'group']);
  });
});
