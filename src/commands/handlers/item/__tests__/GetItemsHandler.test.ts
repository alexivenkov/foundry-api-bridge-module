import { getItemsHandler } from '../GetItemsHandler';

interface MockItem {
  id: string;
  uuid: string;
  name: string;
  type: string;
  img: string | undefined;
  folder: { name: string } | null;
  toObject: jest.Mock;
}

function createMockItem(overrides?: Partial<MockItem>): MockItem {
  return {
    id: 'item-1',
    uuid: 'Item.item-1',
    name: 'Longsword',
    type: 'weapon',
    img: 'items/sword.webp',
    folder: { name: 'Weapons' },
    toObject: jest.fn().mockReturnValue({ system: { damage: '1d8', weight: 3 } }),
    ...overrides
  };
}

function setGame(items: MockItem[] | undefined): void {
  const collection = items !== undefined
    ? { forEach: jest.fn((fn: (item: MockItem) => void) => { items.forEach(fn); }) }
    : undefined;
  (globalThis as Record<string, unknown>)['game'] = { items: collection };
}

function clearGame(): void {
  delete (globalThis as Record<string, unknown>)['game'];
}

describe('getItemsHandler', () => {
  afterEach(clearGame);

  it('should return all items with correct fields', async () => {
    setGame([
      createMockItem({ id: 'i1', uuid: 'Item.i1', name: 'Sword', type: 'weapon', img: 'items/sword.webp', folder: { name: 'Weapons' } }),
      createMockItem({ id: 'i2', uuid: 'Item.i2', name: 'Potion', type: 'consumable', img: 'items/potion.webp', folder: null })
    ]);

    const result = await getItemsHandler({} as Record<string, never>);

    expect(result).toHaveLength(2);
    expect(result[0]?.id).toBe('i1');
    expect(result[0]?.uuid).toBe('Item.i1');
    expect(result[0]?.folder).toBe('Weapons');
    expect(result[1]?.folder).toBeNull();
  });

  it('should return empty array when items collection is undefined', async () => {
    setGame(undefined);

    const result = await getItemsHandler({} as Record<string, never>);

    expect(result).toEqual([]);
  });

  it('should return empty array for empty collection', async () => {
    setGame([]);

    const result = await getItemsHandler({} as Record<string, never>);

    expect(result).toEqual([]);
  });

  it('should fallback img to empty string when undefined', async () => {
    setGame([createMockItem({ img: undefined })]);

    const result = await getItemsHandler({} as Record<string, never>);

    expect(result[0]?.img).toBe('');
  });

  it('should call toObject(false) for system data', async () => {
    const item = createMockItem();
    setGame([item]);

    await getItemsHandler({} as Record<string, never>);

    expect(item.toObject).toHaveBeenCalledWith(false);
  });

  it('should pass system data through from toObject', async () => {
    const systemData = { rarity: 'legendary', price: { value: 50000 } };
    setGame([createMockItem({ toObject: jest.fn().mockReturnValue({ system: systemData }) })]);

    const result = await getItemsHandler({} as Record<string, never>);

    expect(result[0]?.system).toEqual(systemData);
  });
});
