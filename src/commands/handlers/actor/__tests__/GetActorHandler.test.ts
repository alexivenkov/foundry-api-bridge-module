import { getActorHandler } from '../GetActorHandler';

interface MockItem {
  id: string;
  name: string;
  type: string;
  img: string | undefined;
}

interface MockActor {
  id: string;
  name: string;
  type: string;
  img: string | undefined;
  getRollData: jest.Mock;
  items: {
    forEach: jest.Mock;
  };
}

function createMockItem(overrides?: Partial<MockItem>): MockItem {
  return {
    id: 'item-1',
    name: 'Sword',
    type: 'weapon',
    img: 'items/sword.webp',
    ...overrides
  };
}

function createMockActor(items: MockItem[] = [], overrides?: Partial<MockActor>): MockActor {
  return {
    id: 'actor-123',
    name: 'Gandalf',
    type: 'npc',
    img: 'tokens/gandalf.webp',
    getRollData: jest.fn().mockReturnValue({
      attributes: { hp: { value: 120, max: 120 }, ac: { value: 18 } },
      abilities: { str: { value: 10, mod: 0 } }
    }),
    items: {
      forEach: jest.fn((fn: (item: MockItem) => void) => {
        items.forEach(fn);
      })
    },
    ...overrides
  };
}

function setGame(actors: Map<string, MockActor>): void {
  (globalThis as Record<string, unknown>)['game'] = {
    actors: {
      get: jest.fn((id: string) => actors.get(id))
    }
  };
}

function clearGame(): void {
  delete (globalThis as Record<string, unknown>)['game'];
}

describe('getActorHandler', () => {
  afterEach(() => {
    clearGame();
  });

  it('should return full actor data with items', async () => {
    const items = [
      createMockItem({ id: 'i1', name: 'Staff', type: 'weapon', img: 'items/staff.webp' }),
      createMockItem({ id: 'i2', name: 'Robe', type: 'equipment', img: 'items/robe.webp' })
    ];
    const actor = createMockActor(items);
    setGame(new Map([['actor-123', actor]]));

    const result = await getActorHandler({ actorId: 'actor-123' });

    expect(result).toEqual({
      id: 'actor-123',
      name: 'Gandalf',
      type: 'npc',
      img: 'tokens/gandalf.webp',
      system: {
        attributes: { hp: { value: 120, max: 120 }, ac: { value: 18 } },
        abilities: { str: { value: 10, mod: 0 } }
      },
      items: [
        { id: 'i1', name: 'Staff', type: 'weapon', img: 'items/staff.webp' },
        { id: 'i2', name: 'Robe', type: 'equipment', img: 'items/robe.webp' }
      ]
    });
  });

  it('should reject with error when actor not found', async () => {
    setGame(new Map());

    await expect(getActorHandler({ actorId: 'nonexistent' }))
      .rejects.toThrow('Actor not found: nonexistent');
  });

  it('should fallback actor img to empty string when undefined', async () => {
    const actor = createMockActor([], { img: undefined });
    setGame(new Map([['a1', actor]]));

    const result = await getActorHandler({ actorId: 'a1' });

    expect(result.img).toBe('');
  });

  it('should return empty items array when actor has no items', async () => {
    const actor = createMockActor([]);
    setGame(new Map([['a1', actor]]));

    const result = await getActorHandler({ actorId: 'a1' });

    expect(result.items).toEqual([]);
  });

  it('should fallback item img to empty string when undefined', async () => {
    const items = [createMockItem({ img: undefined })];
    const actor = createMockActor(items);
    setGame(new Map([['a1', actor]]));

    const result = await getActorHandler({ actorId: 'a1' });

    expect(result.items[0]?.img).toBe('');
  });

  it('should pass through system data from getRollData as-is', async () => {
    const systemData = {
      details: { level: 20, cr: 15 },
      traits: { languages: ['Common', 'Elvish'] },
      custom: { nested: { deep: true } }
    };
    const actor = createMockActor([], {
      getRollData: jest.fn().mockReturnValue(systemData)
    });
    setGame(new Map([['a1', actor]]));

    const result = await getActorHandler({ actorId: 'a1' });

    expect(result.system).toBe(systemData);
    expect(actor.getRollData).toHaveBeenCalledTimes(1);
  });

  it('should collect multiple items preserving order', async () => {
    const items = [
      createMockItem({ id: 'i1', name: 'Alpha' }),
      createMockItem({ id: 'i2', name: 'Beta' }),
      createMockItem({ id: 'i3', name: 'Gamma' })
    ];
    const actor = createMockActor(items);
    setGame(new Map([['a1', actor]]));

    const result = await getActorHandler({ actorId: 'a1' });

    expect(result.items).toHaveLength(3);
    expect(result.items.map(i => i.name)).toEqual(['Alpha', 'Beta', 'Gamma']);
  });

  it('should reject with descriptive error for empty actorId', async () => {
    setGame(new Map());

    await expect(getActorHandler({ actorId: '' }))
      .rejects.toThrow('Actor not found: ');
  });
});
