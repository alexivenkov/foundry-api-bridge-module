import { rollDamageHandler } from '../RollDamageHandler';

interface MockDamageRoll {
  total: number;
  formula: string;
  terms: Array<{
    faces?: number;
    number?: number;
    results?: Array<{ result: number }>;
  }>;
}

const mockRoll: MockDamageRoll = {
  total: 0,
  formula: '',
  terms: []
};

const mockAttackActivity = {
  _id: 'attackCrossHandI',
  type: 'attack',
  rollDamage: jest.fn()
};

const mockItem = {
  id: 'item-123',
  name: 'Hand Crossbow',
  type: 'weapon',
  system: {
    activities: {
      find: jest.fn()
    }
  }
};

const mockActor = {
  id: 'actor-123',
  name: 'Test Actor',
  items: {
    get: jest.fn()
  }
};

const mockGame = {
  actors: {
    get: jest.fn()
  }
};

(global as Record<string, unknown>)['game'] = mockGame;

describe('rollDamageHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGame.actors.get.mockReturnValue(mockActor);
    mockActor.items.get.mockReturnValue(mockItem);
    mockItem.system.activities.find.mockReturnValue(mockAttackActivity);
    mockAttackActivity.rollDamage.mockResolvedValue([mockRoll]);
    mockRoll.total = 7;
    mockRoll.formula = '1d6 + 3';
    mockRoll.terms = [{ faces: 6, number: 1, results: [{ result: 4 }] }];
  });

  describe('successful rolls', () => {
    it('should roll damage and return result', async () => {
      const result = await rollDamageHandler({
        actorId: 'actor-123',
        itemId: 'item-123'
      });

      expect(mockGame.actors.get).toHaveBeenCalledWith('actor-123');
      expect(mockActor.items.get).toHaveBeenCalledWith('item-123');
      expect(mockItem.system.activities.find).toHaveBeenCalled();
      expect(mockAttackActivity.rollDamage).toHaveBeenCalledWith(
        {},
        { configure: false },
        { create: false }
      );
      expect(result).toEqual({
        total: 7,
        formula: '1d6 + 3',
        dice: [{ type: 'd6', count: 1, results: [4] }]
      });
    });

    it('should pass isCritical to rollDamage', async () => {
      const result = await rollDamageHandler({
        actorId: 'actor-123',
        itemId: 'item-123',
        critical: true
      });

      expect(mockAttackActivity.rollDamage).toHaveBeenCalledWith(
        { isCritical: true },
        { configure: false },
        { create: false }
      );
      expect(result.isCritical).toBe(true);
    });

    it('should send to chat when showInChat is true', async () => {
      await rollDamageHandler({
        actorId: 'actor-123',
        itemId: 'item-123',
        showInChat: true
      });

      expect(mockAttackActivity.rollDamage).toHaveBeenCalledWith(
        {},
        { configure: false },
        { create: true }
      );
    });

    it('should handle multiple dice in damage formula', async () => {
      mockRoll.total = 14;
      mockRoll.formula = '2d6 + 3';
      mockRoll.terms = [{ faces: 6, number: 2, results: [{ result: 5 }, { result: 6 }] }];

      const result = await rollDamageHandler({
        actorId: 'actor-123',
        itemId: 'item-123'
      });

      expect(result.dice).toEqual([{ type: 'd6', count: 2, results: [5, 6] }]);
    });

    it('should handle critical damage with doubled dice', async () => {
      mockRoll.total = 18;
      mockRoll.formula = '2d6 + 3';
      mockRoll.terms = [{ faces: 6, number: 2, results: [{ result: 4 }, { result: 5 }, { result: 3 }, { result: 6 }] }];

      const result = await rollDamageHandler({
        actorId: 'actor-123',
        itemId: 'item-123',
        critical: true
      });

      expect(result.isCritical).toBe(true);
      expect(result.total).toBe(18);
    });
  });

  describe('error handling', () => {
    it('should throw error if actor not found', async () => {
      mockGame.actors.get.mockReturnValue(undefined);

      await expect(
        rollDamageHandler({ actorId: 'non-existent', itemId: 'item-123' })
      ).rejects.toThrow('Actor not found: non-existent');
    });

    it('should throw error if item not found', async () => {
      mockActor.items.get.mockReturnValue(undefined);

      await expect(
        rollDamageHandler({ actorId: 'actor-123', itemId: 'non-existent' })
      ).rejects.toThrow('Item not found: non-existent');
    });

    it('should throw error if item has no activities', async () => {
      mockActor.items.get.mockReturnValue({
        id: 'item-123',
        name: 'Broken Item',
        type: 'weapon',
        system: {}
      });

      await expect(
        rollDamageHandler({ actorId: 'actor-123', itemId: 'item-123' })
      ).rejects.toThrow('Item has no activities: Broken Item');
    });

    it('should throw error if item has no attack activity', async () => {
      mockItem.system.activities.find.mockReturnValue(undefined);

      await expect(
        rollDamageHandler({ actorId: 'actor-123', itemId: 'item-123' })
      ).rejects.toThrow('Item has no attack activity: Hand Crossbow');
    });

    it('should throw error if roll returns null', async () => {
      mockAttackActivity.rollDamage.mockResolvedValue(null);

      await expect(
        rollDamageHandler({ actorId: 'actor-123', itemId: 'item-123' })
      ).rejects.toThrow('Damage roll returned no results');
    });

    it('should throw error if roll returns empty array', async () => {
      mockAttackActivity.rollDamage.mockResolvedValue([]);

      await expect(
        rollDamageHandler({ actorId: 'actor-123', itemId: 'item-123' })
      ).rejects.toThrow('Damage roll returned no results');
    });
  });
});