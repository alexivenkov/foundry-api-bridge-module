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
        { consume: false },
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
        { consume: true, scaling: 3 },
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
        { consume: true },
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