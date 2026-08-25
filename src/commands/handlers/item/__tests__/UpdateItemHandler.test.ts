import { updateItemHandler } from '../UpdateItemHandler';

interface MockItemDoc {
  id: string;
  uuid: string;
  name: string;
  type: string;
  img: string;
  folder: { name: string } | null;
  update: jest.Mock;
}

function createMockItem(): MockItemDoc {
  return {
    id: 'item-123',
    uuid: 'Item.item-123',
    name: 'Original Sword',
    type: 'weapon',
    img: 'icons/weapons/sword.webp',
    folder: null,
    update: jest.fn()
  };
}

let mockItem: MockItemDoc;

const mockGame: { items: { get: jest.Mock } | undefined } = {
  items: {
    get: jest.fn()
  }
};

(global as Record<string, unknown>)['game'] = mockGame;

describe('updateItemHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockItem = createMockItem();
    mockGame.items = { get: jest.fn() };
    mockGame.items.get.mockReturnValue(mockItem);
    mockItem.update.mockImplementation(async (data: Record<string, unknown>) => {
      Object.assign(mockItem, data);
      return undefined;
    });
  });

  describe('successful updates', () => {
    it('should update item name', async () => {
      const result = await updateItemHandler({
        itemId: 'item-123',
        name: 'Updated Sword'
      });

      expect(mockGame.items?.get).toHaveBeenCalledWith('item-123');
      expect(mockItem.update).toHaveBeenCalledWith({
        name: 'Updated Sword'
      });
      expect(result).toEqual({
        id: 'item-123',
        uuid: 'Item.item-123',
        name: 'Updated Sword',
        type: 'weapon',
        img: 'icons/weapons/sword.webp',
        folder: null
      });
    });

    it('should update item img', async () => {
      await updateItemHandler({
        itemId: 'item-123',
        img: 'new/sword.png'
      });

      expect(mockItem.update).toHaveBeenCalledWith({
        img: 'new/sword.png'
      });
    });

    it('should update folder to a string id', async () => {
      await updateItemHandler({
        itemId: 'item-123',
        folder: 'folder-456'
      });

      expect(mockItem.update).toHaveBeenCalledWith({
        folder: 'folder-456'
      });
    });

    it('should update folder to null (move to root)', async () => {
      await updateItemHandler({
        itemId: 'item-123',
        folder: null
      });

      expect(mockItem.update).toHaveBeenCalledWith({
        folder: null
      });
    });

    it('should update item system data', async () => {
      const systemData = {
        damage: { parts: [['2d8', 'slashing']] }
      };

      await updateItemHandler({
        itemId: 'item-123',
        system: systemData
      });

      expect(mockItem.update).toHaveBeenCalledWith({
        system: systemData
      });
    });

    it('should not include undefined fields in update', async () => {
      await updateItemHandler({
        itemId: 'item-123',
        name: 'Only Name'
      });

      const updateCall = mockItem.update.mock.calls[0][0];
      expect(updateCall).toEqual({ name: 'Only Name' });
      expect(updateCall).not.toHaveProperty('img');
      expect(updateCall).not.toHaveProperty('folder');
      expect(updateCall).not.toHaveProperty('system');
    });

    it('should return folder name when item has folder', async () => {
      mockItem.update.mockImplementation(async () => {
        mockItem.folder = { name: 'Weapons' };
        return undefined;
      });

      const result = await updateItemHandler({
        itemId: 'item-123',
        name: 'Updated Sword'
      });

      expect(result.folder).toBe('Weapons');
    });

    it('should resolve with current values when no-op update() resolves undefined without mutating', async () => {
      mockItem.update.mockResolvedValue(undefined);

      const result = await updateItemHandler({
        itemId: 'item-123',
        name: 'Original Sword'
      });

      expect(mockItem.update).toHaveBeenCalledWith({
        name: 'Original Sword'
      });
      expect(result).toEqual({
        id: 'item-123',
        uuid: 'Item.item-123',
        name: 'Original Sword',
        type: 'weapon',
        img: 'icons/weapons/sword.webp',
        folder: null
      });
    });
  });

  describe('error handling', () => {
    it('should throw error if item not found', async () => {
      mockGame.items = { get: jest.fn().mockReturnValue(undefined) };

      await expect(
        updateItemHandler({
          itemId: 'non-existent',
          name: 'New Name'
        })
      ).rejects.toThrow('Item not found: non-existent');
    });

    it('should throw error if game.items is undefined', async () => {
      mockGame.items = undefined;

      await expect(
        updateItemHandler({
          itemId: 'item-123',
          name: 'New Name'
        })
      ).rejects.toThrow('Item not found: item-123');
    });
  });
});
