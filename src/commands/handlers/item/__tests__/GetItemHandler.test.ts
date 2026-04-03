import { getItemHandler } from '../GetItemHandler';

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
    toObject: jest.fn().mockReturnValue({ system: { damage: '1d8' } }),
    ...overrides
  };
}

function setGame(items: Map<string, MockItem>): void {
  (globalThis as Record<string, unknown>)['game'] = {
    items: { get: jest.fn((id: string) => items.get(id)) }
  };
}

function clearGame(): void {
  delete (globalThis as Record<string, unknown>)['game'];
}

describe('getItemHandler', () => {
  afterEach(clearGame);

  it('should return full item data', async () => {
    const item = createMockItem({ id: 'i1', uuid: 'Item.i1', name: 'Staff', type: 'weapon', folder: { name: 'Staves' } });
    setGame(new Map([['i1', item]]));

    const result = await getItemHandler({ itemId: 'i1' });

    expect(result).toEqual({
      id: 'i1',
      uuid: 'Item.i1',
      name: 'Staff',
      type: 'weapon',
      img: 'items/sword.webp',
      folder: 'Staves',
      system: { damage: '1d8' }
    });
  });

  it('should reject when item not found', async () => {
    setGame(new Map());

    await expect(getItemHandler({ itemId: 'nonexistent' }))
      .rejects.toThrow('Item not found: nonexistent');
  });

  it('should reject with descriptive error for empty itemId', async () => {
    setGame(new Map());

    await expect(getItemHandler({ itemId: '' }))
      .rejects.toThrow('Item not found: ');
  });

  it('should pass system data through from toObject(false)', async () => {
    const systemData = { rarity: 'legendary', attunement: 1 };
    const item = createMockItem({ toObject: jest.fn().mockReturnValue({ system: systemData }) });
    setGame(new Map([['i1', item]]));

    const result = await getItemHandler({ itemId: 'i1' });

    expect(result.system).toEqual(systemData);
    expect(item.toObject).toHaveBeenCalledWith(false);
  });

  it('should fallback img to empty string when undefined', async () => {
    const item = createMockItem({ img: undefined });
    setGame(new Map([['item-1', item]]));

    const result = await getItemHandler({ itemId: 'item-1' });

    expect(result.img).toBe('');
  });
});
