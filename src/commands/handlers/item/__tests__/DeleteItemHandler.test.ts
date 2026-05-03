import { deleteItemHandler } from '../DeleteItemHandler';

const mockItem = {
  id: 'item-123',
  delete: jest.fn()
};

const mockGame: { items: { get: jest.Mock } | undefined } = {
  items: {
    get: jest.fn()
  }
};

(global as Record<string, unknown>)['game'] = mockGame;

describe('deleteItemHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGame.items = { get: jest.fn() };
    mockGame.items.get.mockReturnValue(mockItem);
    mockItem.delete.mockResolvedValue(mockItem);
  });

  describe('successful deletion', () => {
    it('should delete an item and return success with itemId', async () => {
      const result = await deleteItemHandler({
        itemId: 'item-123'
      });

      expect(mockGame.items?.get).toHaveBeenCalledWith('item-123');
      expect(mockItem.delete).toHaveBeenCalled();
      expect(result).toEqual({
        deleted: true,
        itemId: 'item-123'
      });
    });
  });

  describe('error handling', () => {
    it('should throw error if item not found', async () => {
      mockGame.items = { get: jest.fn().mockReturnValue(undefined) };

      await expect(
        deleteItemHandler({ itemId: 'non-existent' })
      ).rejects.toThrow('Item not found: non-existent');
    });

    it('should throw error if game.items is undefined', async () => {
      mockGame.items = undefined;

      await expect(
        deleteItemHandler({ itemId: 'item-123' })
      ).rejects.toThrow('Item not found: item-123');
    });
  });
});
