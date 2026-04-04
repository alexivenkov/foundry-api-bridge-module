import { getActorHandler } from '../GetActorHandler';

interface MockItem {
  id: string;
  name: string;
  type: string;
  img: string | undefined;
  toObject: jest.Mock;
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
    toObject: jest.fn().mockReturnValue({ system: { damage: '1d8' } }),
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
      abilities: { str: { value: 10, mod: 0, save: 0 } }
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
  afterEach(clearGame);

  it('should return full actor data with items including system', async () => {
    const items = [
      createMockItem({
        id: 'i1', name: 'Staff', type: 'weapon', img: 'items/staff.webp',
        toObject: jest.fn().mockReturnValue({ system: { damage: '1d6', weight: 4 } })
      }),
      createMockItem({
        id: 'i2', name: 'Robe', type: 'equipment', img: 'items/robe.webp',
        toObject: jest.fn().mockReturnValue({ system: { ac: { value: 12 } } })
      })
    ];
    const actor = createMockActor(items);
    setGame(new Map([['actor-123', actor]]));

    const result = await getActorHandler({ actorId: 'actor-123' });

    expect(result.items).toEqual([
      { id: 'i1', name: 'Staff', type: 'weapon', img: 'items/staff.webp', system: { damage: '1d6', weight: 4 } },
      { id: 'i2', name: 'Robe', type: 'equipment', img: 'items/robe.webp', system: { ac: { value: 12 } } }
    ]);
  });

  it('should call toObject(false) on each item', async () => {
    const item = createMockItem();
    const actor = createMockActor([item]);
    setGame(new Map([['a1', actor]]));

    await getActorHandler({ actorId: 'a1' });

    expect(item.toObject).toHaveBeenCalledWith(false);
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

  it('should pass through actor system data from getRollData as-is', async () => {
    const systemData = {
      abilities: { str: { value: 10, mod: 0, save: 4 } },
      details: { level: 20 }
    };
    const actor = createMockActor([], {
      getRollData: jest.fn().mockReturnValue(systemData)
    });
    setGame(new Map([['a1', actor]]));

    const result = await getActorHandler({ actorId: 'a1' });

    expect(result.system).toBe(systemData);
  });

  it('should pass through item system data from toObject as-is', async () => {
    const itemSystem = {
      description: { value: '<p>A magical staff</p>' },
      damage: { base: { formula: '1d6+4', types: ['bludgeoning'] } },
      range: { reach: 5, units: 'ft' }
    };
    const item = createMockItem({
      toObject: jest.fn().mockReturnValue({ system: itemSystem })
    });
    const actor = createMockActor([item]);
    setGame(new Map([['a1', actor]]));

    const result = await getActorHandler({ actorId: 'a1' });

    expect(result.items[0]?.system).toEqual(itemSystem);
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
