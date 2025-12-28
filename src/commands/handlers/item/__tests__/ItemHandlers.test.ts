const mockActivity = {
  _id: 'activity-123',
  name: 'Attack',
  type: 'attack',
  use: jest.fn()
};

const mockActivitiesCollection = {
  contents: [mockActivity],
  get: jest.fn(),
  find: jest.fn()
};

const mockWeapon = {
  id: 'weapon-123',
  name: 'Longsword',
  type: 'weapon',
  img: 'icons/weapons/swords/sword.png',
  system: {
    activities: mockActivitiesCollection,
    equipped: true,
    quantity: 1
  },
  use: jest.fn(),
  displayCard: jest.fn()
};

const mockArmor = {
  id: 'armor-456',
  name: 'Chain Mail',
  type: 'equipment',
  img: 'icons/armor/chest/chainmail.png',
  system: {
    equipped: true,
    quantity: 1
  },
  use: jest.fn(),
  displayCard: jest.fn()
};

const mockPotion = {
  id: 'potion-789',
  name: 'Healing Potion',
  type: 'consumable',
  img: 'icons/consumables/potions/potion-red.png',
  system: {
    equipped: false,
    quantity: 3
  },
  use: jest.fn(),
  displayCard: jest.fn()
};

const mockActor = {
  id: 'actor-123',
  name: 'Test Hero',
  items: {
    contents: [mockWeapon, mockArmor, mockPotion],
    get: jest.fn()
  }
};

const mockGame = {
  actors: {
    get: jest.fn()
  }
};

(globalThis as Record<string, unknown>)['game'] = mockGame;

import { getActorItemsHandler } from '../GetActorItemsHandler';
import { useItemHandler } from '../UseItemHandler';

describe('getActorItemsHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGame.actors.get.mockReturnValue(mockActor);
  });

  describe('successful queries', () => {
    it('should return all items for an actor', async () => {
      const result = await getActorItemsHandler({ actorId: 'actor-123' });

      expect(mockGame.actors.get).toHaveBeenCalledWith('actor-123');
      expect(result.actorId).toBe('actor-123');
      expect(result.actorName).toBe('Test Hero');
      expect(result.items).toHaveLength(3);
    });

    it('should return item details with activity info', async () => {
      const result = await getActorItemsHandler({ actorId: 'actor-123' });

      const sword = result.items.find(i => i.id === 'weapon-123');
      expect(sword).toEqual({
        id: 'weapon-123',
        name: 'Longsword',
        type: 'weapon',
        img: 'icons/weapons/swords/sword.png',
        equipped: true,
        quantity: 1,
        hasActivities: true,
        activityTypes: ['attack']
      });
    });

    it('should filter items by type', async () => {
      const result = await getActorItemsHandler({
        actorId: 'actor-123',
        type: 'weapon'
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.name).toBe('Longsword');
    });

    it('should filter items by equipped status', async () => {
      const result = await getActorItemsHandler({
        actorId: 'actor-123',
        equipped: true
      });

      expect(result.items).toHaveLength(2);
      expect(result.items.map(i => i.name)).toContain('Longsword');
      expect(result.items.map(i => i.name)).toContain('Chain Mail');
    });

    it('should filter items by hasActivities', async () => {
      const result = await getActorItemsHandler({
        actorId: 'actor-123',
        hasActivities: true
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.name).toBe('Longsword');
    });

    it('should return empty array for actor with no items', async () => {
      mockGame.actors.get.mockReturnValue({
        id: 'empty-actor',
        name: 'Empty Actor',
        items: { contents: [] }
      });

      const result = await getActorItemsHandler({ actorId: 'empty-actor' });

      expect(result.items).toHaveLength(0);
    });
  });

  describe('error handling', () => {
    it('should reject if actor not found', async () => {
      mockGame.actors.get.mockReturnValue(undefined);

      await expect(getActorItemsHandler({ actorId: 'non-existent' })).rejects.toThrow(
        'Actor not found: non-existent'
      );
    });
  });
});

describe('useItemHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGame.actors.get.mockReturnValue(mockActor);
    mockActor.items.get.mockReturnValue(mockWeapon);
    mockActivitiesCollection.get.mockReturnValue(mockActivity);
    mockActivitiesCollection.find.mockReturnValue(mockActivity);
    mockActivity.use.mockResolvedValue({
      rolls: [
        {
          total: 18,
          formula: '1d20 + 5',
          terms: [{ faces: 20, number: 1, results: [{ result: 13 }] }],
          isCritical: false,
          isFumble: false
        }
      ],
      message: { id: 'msg-123' }
    });
  });

  describe('successful usage', () => {
    it('should use item with first activity', async () => {
      const result = await useItemHandler({
        actorId: 'actor-123',
        itemId: 'weapon-123'
      });

      expect(result.itemId).toBe('weapon-123');
      expect(result.itemName).toBe('Longsword');
      expect(result.itemType).toBe('weapon');
      expect(result.activityUsed).toEqual({
        id: 'activity-123',
        name: 'Attack',
        type: 'attack'
      });
      expect(result.rolls).toHaveLength(1);
      expect(result.rolls[0]?.total).toBe(18);
    });

    it('should use specific activity by id', async () => {
      await useItemHandler({
        actorId: 'actor-123',
        itemId: 'weapon-123',
        activityId: 'activity-123'
      });

      expect(mockActivitiesCollection.get).toHaveBeenCalledWith('activity-123');
    });

    it('should use specific activity by type', async () => {
      await useItemHandler({
        actorId: 'actor-123',
        itemId: 'weapon-123',
        activityType: 'attack'
      });

      expect(mockActivitiesCollection.find).toHaveBeenCalled();
    });

    it('should pass consume option to activity.use', async () => {
      await useItemHandler({
        actorId: 'actor-123',
        itemId: 'weapon-123',
        consume: false
      });

      expect(mockActivity.use).toHaveBeenCalledWith(
        {
          consume: false,
          scaling: false,
          concentration: { begin: false },
          create: { measuredTemplate: false },
          event: { shiftKey: true }
        },
        { configure: false },
        { create: false }
      );
    });

    it('should pass scaling option to activity.use', async () => {
      await useItemHandler({
        actorId: 'actor-123',
        itemId: 'weapon-123',
        scaling: 3
      });

      expect(mockActivity.use).toHaveBeenCalledWith(
        {
          consume: { resources: true, spellSlot: true },
          scaling: 3,
          concentration: { begin: false },
          create: { measuredTemplate: false },
          event: { shiftKey: true }
        },
        { configure: false },
        { create: false }
      );
    });

    it('should create chat message when showInChat is true', async () => {
      await useItemHandler({
        actorId: 'actor-123',
        itemId: 'weapon-123',
        showInChat: true
      });

      expect(mockActivity.use).toHaveBeenCalledWith(
        {
          consume: { resources: true, spellSlot: true },
          scaling: false,
          concentration: { begin: false },
          create: { measuredTemplate: false },
          event: { shiftKey: true }
        },
        { configure: false },
        { create: true }
      );
    });

    it('should return chatMessageId when available', async () => {
      const result = await useItemHandler({
        actorId: 'actor-123',
        itemId: 'weapon-123'
      });

      expect(result.chatMessageId).toBe('msg-123');
    });

    it('should extract dice results from rolls', async () => {
      const result = await useItemHandler({
        actorId: 'actor-123',
        itemId: 'weapon-123'
      });

      expect(result.rolls[0]?.dice).toEqual([
        { type: 'd20', count: 1, results: [13] }
      ]);
    });

    it('should handle item with no activities by calling displayCard', async () => {
      mockActor.items.get.mockReturnValue(mockPotion);
      mockPotion.displayCard.mockResolvedValue({ id: 'card-msg-123' });

      const result = await useItemHandler({
        actorId: 'actor-123',
        itemId: 'potion-789'
      });

      expect(mockPotion.displayCard).toHaveBeenCalledWith({ create: false });
      expect(result.itemName).toBe('Healing Potion');
      expect(result.activityUsed).toBeUndefined();
      expect(result.rolls).toHaveLength(0);
    });

    it('should handle activity.use returning null', async () => {
      mockActivity.use.mockResolvedValue(null);

      const result = await useItemHandler({
        actorId: 'actor-123',
        itemId: 'weapon-123'
      });

      expect(result.rolls).toHaveLength(0);
      expect(result.chatMessageId).toBeUndefined();
    });

    it('should detect critical hits', async () => {
      mockActivity.use.mockResolvedValue({
        rolls: [
          {
            total: 25,
            formula: '1d20 + 5',
            terms: [{ faces: 20, number: 1, results: [{ result: 20 }] }],
            isCritical: true,
            isFumble: false
          }
        ]
      });

      const result = await useItemHandler({
        actorId: 'actor-123',
        itemId: 'weapon-123'
      });

      expect(result.rolls[0]?.isCritical).toBe(true);
    });

    it('should detect fumbles', async () => {
      mockActivity.use.mockResolvedValue({
        rolls: [
          {
            total: 6,
            formula: '1d20 + 5',
            terms: [{ faces: 20, number: 1, results: [{ result: 1 }] }],
            isCritical: false,
            isFumble: true
          }
        ]
      });

      const result = await useItemHandler({
        actorId: 'actor-123',
        itemId: 'weapon-123'
      });

      expect(result.rolls[0]?.isFumble).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should throw error if actor not found', async () => {
      mockGame.actors.get.mockReturnValue(undefined);

      await expect(
        useItemHandler({ actorId: 'non-existent', itemId: 'weapon-123' })
      ).rejects.toThrow('Actor not found: non-existent');
    });

    it('should throw error if item not found', async () => {
      mockActor.items.get.mockReturnValue(undefined);

      await expect(
        useItemHandler({ actorId: 'actor-123', itemId: 'non-existent' })
      ).rejects.toThrow('Item not found: non-existent');
    });

    it('should throw error if activity not found by id', async () => {
      mockActivitiesCollection.get.mockReturnValue(undefined);

      await expect(
        useItemHandler({
          actorId: 'actor-123',
          itemId: 'weapon-123',
          activityId: 'non-existent'
        })
      ).rejects.toThrow('Activity not found: non-existent');
    });

    it('should throw error if activity not found by type', async () => {
      mockActivitiesCollection.find.mockReturnValue(undefined);

      await expect(
        useItemHandler({
          actorId: 'actor-123',
          itemId: 'weapon-123',
          activityType: 'heal'
        })
      ).rejects.toThrow("No activity of type 'heal' found on item: Longsword");
    });
  });
});

// Mock for CRUD handlers
const mockCreatedItem = {
  id: 'new-item-123',
  name: 'New Sword',
  type: 'weapon',
  img: 'icons/weapons/swords/new-sword.png'
};

const mockCompendiumItem = {
  id: 'compendium-item-456',
  name: 'Compendium Sword',
  type: 'weapon',
  img: 'icons/weapons/swords/compendium-sword.png',
  toObject: jest.fn().mockReturnValue({
    name: 'Compendium Sword',
    type: 'weapon',
    img: 'icons/weapons/swords/compendium-sword.png',
    system: { quantity: 1 }
  })
};

const mockPack = {
  collection: 'dnd5e.items',
  metadata: { type: 'Item' },
  getDocument: jest.fn()
};

const mockActorWithCrud = {
  id: 'actor-123',
  name: 'Test Hero',
  items: {
    contents: [mockWeapon, mockArmor, mockPotion],
    get: jest.fn()
  },
  createEmbeddedDocuments: jest.fn(),
  updateEmbeddedDocuments: jest.fn(),
  deleteEmbeddedDocuments: jest.fn()
};

const mockGameWithPacks = {
  actors: {
    get: jest.fn()
  },
  packs: {
    get: jest.fn()
  }
};

import { addItemToActorHandler } from '../AddItemToActorHandler';
import { addItemFromCompendiumHandler } from '../AddItemFromCompendiumHandler';
import { updateActorItemHandler } from '../UpdateActorItemHandler';
import { deleteActorItemHandler } from '../DeleteActorItemHandler';

describe('addItemToActorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (globalThis as Record<string, unknown>)['game'] = mockGameWithPacks;
    mockGameWithPacks.actors.get.mockReturnValue(mockActorWithCrud);
    mockActorWithCrud.createEmbeddedDocuments.mockResolvedValue([mockCreatedItem]);
  });

  it('should create item on actor', async () => {
    const result = await addItemToActorHandler({
      actorId: 'actor-123',
      name: 'New Sword',
      type: 'weapon'
    });

    expect(mockActorWithCrud.createEmbeddedDocuments).toHaveBeenCalledWith('Item', [
      { name: 'New Sword', type: 'weapon' }
    ]);
    expect(result.id).toBe('new-item-123');
    expect(result.name).toBe('New Sword');
    expect(result.actorId).toBe('actor-123');
    expect(result.actorName).toBe('Test Hero');
  });

  it('should pass img and system data', async () => {
    await addItemToActorHandler({
      actorId: 'actor-123',
      name: 'Magic Sword',
      type: 'weapon',
      img: 'icons/magic-sword.png',
      system: { quantity: 2, rarity: 'rare' }
    });

    expect(mockActorWithCrud.createEmbeddedDocuments).toHaveBeenCalledWith('Item', [
      {
        name: 'Magic Sword',
        type: 'weapon',
        img: 'icons/magic-sword.png',
        system: { quantity: 2, rarity: 'rare' }
      }
    ]);
  });

  it('should throw error if actor not found', async () => {
    mockGameWithPacks.actors.get.mockReturnValue(undefined);

    await expect(
      addItemToActorHandler({ actorId: 'non-existent', name: 'Sword', type: 'weapon' })
    ).rejects.toThrow('Actor not found: non-existent');
  });
});

describe('addItemFromCompendiumHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (globalThis as Record<string, unknown>)['game'] = mockGameWithPacks;
    mockGameWithPacks.actors.get.mockReturnValue(mockActorWithCrud);
    mockGameWithPacks.packs.get.mockReturnValue(mockPack);
    mockPack.getDocument.mockResolvedValue(mockCompendiumItem);
    mockActorWithCrud.createEmbeddedDocuments.mockResolvedValue([{
      id: 'created-from-compendium',
      name: 'Compendium Sword',
      type: 'weapon',
      img: 'icons/weapons/swords/compendium-sword.png'
    }]);
  });

  it('should add item from compendium to actor', async () => {
    const result = await addItemFromCompendiumHandler({
      actorId: 'actor-123',
      packId: 'dnd5e.items',
      itemId: 'compendium-item-456'
    });

    expect(mockPack.getDocument).toHaveBeenCalledWith('compendium-item-456');
    expect(mockActorWithCrud.createEmbeddedDocuments).toHaveBeenCalled();
    expect(result.id).toBe('created-from-compendium');
    expect(result.actorId).toBe('actor-123');
  });

  it('should override name if provided', async () => {
    await addItemFromCompendiumHandler({
      actorId: 'actor-123',
      packId: 'dnd5e.items',
      itemId: 'compendium-item-456',
      name: 'Custom Name'
    });

    const callArgs = mockActorWithCrud.createEmbeddedDocuments.mock.calls[0] as [string, Record<string, unknown>[]];
    expect(callArgs[1][0]?.['name']).toBe('Custom Name');
  });

  it('should set quantity if provided', async () => {
    await addItemFromCompendiumHandler({
      actorId: 'actor-123',
      packId: 'dnd5e.items',
      itemId: 'compendium-item-456',
      quantity: 5
    });

    const callArgs = mockActorWithCrud.createEmbeddedDocuments.mock.calls[0] as [string, Record<string, unknown>[]];
    const system = callArgs[1][0]?.['system'] as Record<string, unknown>;
    expect(system['quantity']).toBe(5);
  });

  it('should throw error if pack not found', async () => {
    mockGameWithPacks.packs.get.mockReturnValue(undefined);

    await expect(
      addItemFromCompendiumHandler({
        actorId: 'actor-123',
        packId: 'invalid-pack',
        itemId: 'item-123'
      })
    ).rejects.toThrow('Compendium pack not found: invalid-pack');
  });

  it('should throw error if pack is not Item type', async () => {
    mockGameWithPacks.packs.get.mockReturnValue({
      ...mockPack,
      metadata: { type: 'Actor' }
    });

    await expect(
      addItemFromCompendiumHandler({
        actorId: 'actor-123',
        packId: 'dnd5e.monsters',
        itemId: 'item-123'
      })
    ).rejects.toThrow('Compendium pack is not an Item pack: dnd5e.monsters');
  });

  it('should throw error if item not found in compendium', async () => {
    mockPack.getDocument.mockResolvedValue(null);

    await expect(
      addItemFromCompendiumHandler({
        actorId: 'actor-123',
        packId: 'dnd5e.items',
        itemId: 'non-existent'
      })
    ).rejects.toThrow('Item not found in compendium: non-existent');
  });
});

describe('updateActorItemHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (globalThis as Record<string, unknown>)['game'] = mockGameWithPacks;
    mockGameWithPacks.actors.get.mockReturnValue(mockActorWithCrud);
    mockActorWithCrud.items.get.mockReturnValue(mockWeapon);
    mockActorWithCrud.updateEmbeddedDocuments.mockResolvedValue([{
      id: 'weapon-123',
      name: 'Updated Sword',
      type: 'weapon',
      img: 'icons/updated-sword.png'
    }]);
  });

  it('should update item on actor', async () => {
    const result = await updateActorItemHandler({
      actorId: 'actor-123',
      itemId: 'weapon-123',
      name: 'Updated Sword'
    });

    expect(mockActorWithCrud.updateEmbeddedDocuments).toHaveBeenCalledWith('Item', [
      { _id: 'weapon-123', name: 'Updated Sword' }
    ]);
    expect(result.name).toBe('Updated Sword');
  });

  it('should update system properties using dot notation', async () => {
    await updateActorItemHandler({
      actorId: 'actor-123',
      itemId: 'weapon-123',
      system: { quantity: 10 }
    });

    expect(mockActorWithCrud.updateEmbeddedDocuments).toHaveBeenCalledWith('Item', [
      { _id: 'weapon-123', 'system.quantity': 10 }
    ]);
  });

  it('should throw error if actor not found', async () => {
    mockGameWithPacks.actors.get.mockReturnValue(undefined);

    await expect(
      updateActorItemHandler({ actorId: 'non-existent', itemId: 'weapon-123' })
    ).rejects.toThrow('Actor not found: non-existent');
  });

  it('should throw error if item not found', async () => {
    mockActorWithCrud.items.get.mockReturnValue(undefined);

    await expect(
      updateActorItemHandler({ actorId: 'actor-123', itemId: 'non-existent' })
    ).rejects.toThrow('Item not found: non-existent');
  });
});

describe('deleteActorItemHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (globalThis as Record<string, unknown>)['game'] = mockGameWithPacks;
    mockGameWithPacks.actors.get.mockReturnValue(mockActorWithCrud);
    mockActorWithCrud.items.get.mockReturnValue(mockWeapon);
    mockActorWithCrud.deleteEmbeddedDocuments.mockResolvedValue([mockWeapon]);
  });

  it('should delete item from actor', async () => {
    const result = await deleteActorItemHandler({
      actorId: 'actor-123',
      itemId: 'weapon-123'
    });

    expect(mockActorWithCrud.deleteEmbeddedDocuments).toHaveBeenCalledWith('Item', ['weapon-123']);
    expect(result.deleted).toBe(true);
  });

  it('should throw error if actor not found', async () => {
    mockGameWithPacks.actors.get.mockReturnValue(undefined);

    await expect(
      deleteActorItemHandler({ actorId: 'non-existent', itemId: 'weapon-123' })
    ).rejects.toThrow('Actor not found: non-existent');
  });

  it('should throw error if item not found', async () => {
    mockActorWithCrud.items.get.mockReturnValue(undefined);

    await expect(
      deleteActorItemHandler({ actorId: 'actor-123', itemId: 'non-existent' })
    ).rejects.toThrow('Item not found: non-existent');
  });
});