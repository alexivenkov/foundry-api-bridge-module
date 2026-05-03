import { createItemHandler } from '../CreateItemHandler';

const mockCreatedItem = {
  id: 'new-item-123',
  uuid: 'Item.new-item-123',
  name: 'Cask of Salted Pork',
  type: 'consumable',
  img: 'icons/consumables/meat.webp',
  folder: null
};

const mockGame = {
  items: {
    documentClass: {
      create: jest.fn()
    }
  }
};

(global as Record<string, unknown>)['game'] = mockGame;

describe('createItemHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGame.items.documentClass.create.mockResolvedValue(mockCreatedItem);
  });

  describe('successful creation', () => {
    it('should create an item with required fields', async () => {
      const result = await createItemHandler({
        name: 'Cask of Salted Pork',
        type: 'consumable'
      });

      expect(mockGame.items.documentClass.create).toHaveBeenCalledWith({
        name: 'Cask of Salted Pork',
        type: 'consumable'
      });
      expect(result).toEqual({
        id: 'new-item-123',
        uuid: 'Item.new-item-123',
        name: 'Cask of Salted Pork',
        type: 'consumable',
        img: 'icons/consumables/meat.webp',
        folder: null
      });
    });

    it('should pass folder when provided', async () => {
      await createItemHandler({
        name: 'Longsword',
        type: 'weapon',
        folder: 'folder-123'
      });

      expect(mockGame.items.documentClass.create).toHaveBeenCalledWith({
        name: 'Longsword',
        type: 'weapon',
        folder: 'folder-123'
      });
    });

    it('should pass img when provided', async () => {
      await createItemHandler({
        name: 'Longsword',
        type: 'weapon',
        img: 'path/to/sword.png'
      });

      expect(mockGame.items.documentClass.create).toHaveBeenCalledWith({
        name: 'Longsword',
        type: 'weapon',
        img: 'path/to/sword.png'
      });
    });

    it('should pass system data when provided', async () => {
      const systemData = {
        damage: { parts: [['1d8', 'slashing']] },
        weight: 3
      };

      await createItemHandler({
        name: 'Longsword',
        type: 'weapon',
        system: systemData
      });

      expect(mockGame.items.documentClass.create).toHaveBeenCalledWith({
        name: 'Longsword',
        type: 'weapon',
        system: systemData
      });
    });

    it('should pass all optional fields when provided', async () => {
      await createItemHandler({
        name: 'Magic Sword',
        type: 'weapon',
        folder: 'folder-456',
        img: 'custom/sword.png',
        system: { rarity: 'rare' }
      });

      expect(mockGame.items.documentClass.create).toHaveBeenCalledWith({
        name: 'Magic Sword',
        type: 'weapon',
        folder: 'folder-456',
        img: 'custom/sword.png',
        system: { rarity: 'rare' }
      });
    });

    it('should return folder name when item has folder', async () => {
      mockGame.items.documentClass.create.mockResolvedValue({
        ...mockCreatedItem,
        folder: { name: 'Treasure' }
      });

      const result = await createItemHandler({
        name: 'Gold Coin',
        type: 'loot'
      });

      expect(result.folder).toBe('Treasure');
    });
  });
});
