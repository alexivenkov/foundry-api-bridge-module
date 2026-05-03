import { createItemFromCompendiumHandler } from '../CreateItemFromCompendiumHandler';

const mockCompendiumItem = {
  id: 'comp-item-123',
  uuid: 'Compendium.dnd5e.items.comp-item-123',
  name: 'Longsword',
  type: 'weapon',
  img: 'icons/weapons/sword.png',
  folder: null,
  toObject: jest.fn()
};

const mockCreatedItem = {
  id: 'new-item-456',
  uuid: 'Item.new-item-456',
  name: 'Longsword',
  type: 'weapon',
  img: 'icons/weapons/sword.png',
  folder: null
};

const mockPack = {
  collection: 'dnd5e.items',
  metadata: {
    type: 'Item'
  },
  getDocument: jest.fn()
};

const mockGame = {
  items: {
    documentClass: {
      create: jest.fn()
    }
  },
  packs: {
    get: jest.fn()
  }
};

(global as Record<string, unknown>)['game'] = mockGame;

describe('createItemFromCompendiumHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGame.packs.get.mockReturnValue(mockPack);
    mockPack.getDocument.mockResolvedValue(mockCompendiumItem);
    mockCompendiumItem.toObject.mockReturnValue({
      _id: 'comp-item-123',
      name: 'Longsword',
      type: 'weapon',
      img: 'icons/weapons/sword.png',
      system: { damage: { parts: [['1d8', 'slashing']] } }
    });
    mockGame.items.documentClass.create.mockResolvedValue(mockCreatedItem);
  });

  describe('successful creation', () => {
    it('should create an item from compendium', async () => {
      const result = await createItemFromCompendiumHandler({
        packId: 'dnd5e.items',
        itemId: 'comp-item-123'
      });

      expect(mockGame.packs.get).toHaveBeenCalledWith('dnd5e.items');
      expect(mockPack.getDocument).toHaveBeenCalledWith('comp-item-123');
      expect(mockCompendiumItem.toObject).toHaveBeenCalled();
      expect(mockGame.items.documentClass.create).toHaveBeenCalledWith({
        name: 'Longsword',
        type: 'weapon',
        img: 'icons/weapons/sword.png',
        system: { damage: { parts: [['1d8', 'slashing']] } }
      });
      expect(result).toEqual({
        id: 'new-item-456',
        uuid: 'Item.new-item-456',
        name: 'Longsword',
        type: 'weapon',
        img: 'icons/weapons/sword.png',
        folder: null
      });
    });

    it('should override name when provided', async () => {
      await createItemFromCompendiumHandler({
        packId: 'dnd5e.items',
        itemId: 'comp-item-123',
        name: 'Custom Sword'
      });

      expect(mockGame.items.documentClass.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Custom Sword' })
      );
    });

    it('should set folder when provided', async () => {
      await createItemFromCompendiumHandler({
        packId: 'dnd5e.items',
        itemId: 'comp-item-123',
        folder: 'folder-789'
      });

      expect(mockGame.items.documentClass.create).toHaveBeenCalledWith(
        expect.objectContaining({ folder: 'folder-789' })
      );
    });

    it('should remove _id from compendium data before creating', async () => {
      await createItemFromCompendiumHandler({
        packId: 'dnd5e.items',
        itemId: 'comp-item-123'
      });

      const createCall = mockGame.items.documentClass.create.mock.calls[0][0];
      expect(createCall).not.toHaveProperty('_id');
      expect(createCall['_id']).toBeUndefined();
    });

    it('should return folder name when item has folder', async () => {
      mockGame.items.documentClass.create.mockResolvedValue({
        ...mockCreatedItem,
        folder: { name: 'Weapons' }
      });

      const result = await createItemFromCompendiumHandler({
        packId: 'dnd5e.items',
        itemId: 'comp-item-123'
      });

      expect(result.folder).toBe('Weapons');
    });
  });

  describe('error handling', () => {
    it('should throw error if pack not found', async () => {
      mockGame.packs.get.mockReturnValue(undefined);

      await expect(
        createItemFromCompendiumHandler({
          packId: 'non-existent.pack',
          itemId: 'comp-item-123'
        })
      ).rejects.toThrow('Compendium pack not found: non-existent.pack');
    });

    it('should throw error if pack is not an Item pack', async () => {
      mockGame.packs.get.mockReturnValue({
        ...mockPack,
        metadata: { type: 'Actor' }
      });

      await expect(
        createItemFromCompendiumHandler({
          packId: 'dnd5e.monsters',
          itemId: 'comp-item-123'
        })
      ).rejects.toThrow('Compendium pack is not an Item pack: dnd5e.monsters');
    });

    it('should throw error if item not found in compendium', async () => {
      mockPack.getDocument.mockResolvedValue(null);

      await expect(
        createItemFromCompendiumHandler({
          packId: 'dnd5e.items',
          itemId: 'non-existent'
        })
      ).rejects.toThrow('Item not found in compendium: non-existent');
    });
  });
});
