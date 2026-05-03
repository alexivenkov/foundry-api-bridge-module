import { updateItemHandler } from '../UpdateItemHandler';

const mockUpdatedItem = {
  id: 'item-123',
  uuid: 'Item.item-123',
  name: 'Updated Sword',
  type: 'weapon',
  img: 'icons/weapons/sword.webp',
  folder: null
};

const mockItem = {
  id: 'item-123',
  uuid: 'Item.item-123',
  name: 'Original Sword',
  type: 'weapon',
  img: 'icons/weapons/sword.webp',
  folder: null,
  update: jest.fn()
};

const mockGame: { items: { get: jest.Mock } | undefined } = {
  items: {
    get: jest.fn()
  }
};

(global as Record<string, unknown>)['game'] = mockGame;

describe('updateItemHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGame.items = { get: jest.fn() };
    mockGame.items.get.mockReturnValue(mockItem);
    mockItem.update.mockResolvedValue(mockUpdatedItem);
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
      mockItem.update.mockResolvedValue({
        ...mockUpdatedItem,
        folder: { name: 'Weapons' }
      });

      const result = await updateItemHandler({
        itemId: 'item-123',
        name: 'Updated Sword'
      });

      expect(result.folder).toBe('Weapons');
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
