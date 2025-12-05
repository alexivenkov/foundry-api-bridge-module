import { rollAttackHandler } from '../RollAttackHandler';

interface MockD20Roll {
  total: number;
  formula: string;
  terms: Array<{
    faces?: number;
    number?: number;
    results?: Array<{ result: number }>;
  }>;
  isCritical: boolean;
  isFumble: boolean;
}

const mockRoll: MockD20Roll = {
  total: 0,
  formula: '',
  terms: [],
  isCritical: false,
  isFumble: false
};

const mockAttackActivity = {
  _id: 'attackCrossHandI',
  type: 'attack',
  rollAttack: jest.fn()
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

describe('rollAttackHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGame.actors.get.mockReturnValue(mockActor);
    mockActor.items.get.mockReturnValue(mockItem);
    mockItem.system.activities.find.mockReturnValue(mockAttackActivity);
    mockAttackActivity.rollAttack.mockResolvedValue([mockRoll]);
    mockRoll.total = 18;
    mockRoll.formula = '1d20 + 5';
    mockRoll.terms = [{ faces: 20, number: 1, results: [{ result: 13 }] }];
    mockRoll.isCritical = false;
    mockRoll.isFumble = false;
  });

  describe('successful rolls', () => {
    it('should roll attack and return result', async () => {
      const result = await rollAttackHandler({
        actorId: 'actor-123',
        itemId: 'item-123'
      });

      expect(mockGame.actors.get).toHaveBeenCalledWith('actor-123');
      expect(mockActor.items.get).toHaveBeenCalledWith('item-123');
      expect(mockItem.system.activities.find).toHaveBeenCalled();
      expect(mockAttackActivity.rollAttack).toHaveBeenCalledWith(
        {},
        { configure: false },
        { create: false }
      );
      expect(result).toEqual({
        total: 18,
        formula: '1d20 + 5',
        dice: [{ type: 'd20', count: 1, results: [13] }]
      });
    });

    it('should pass advantage to rollAttack', async () => {
      await rollAttackHandler({
        actorId: 'actor-123',
        itemId: 'item-123',
        advantage: true
      });

      expect(mockAttackActivity.rollAttack).toHaveBeenCalledWith(
        { advantage: true },
        { configure: false },
        { create: false }
      );
    });

    it('should pass disadvantage to rollAttack', async () => {
      await rollAttackHandler({
        actorId: 'actor-123',
        itemId: 'item-123',
        disadvantage: true
      });

      expect(mockAttackActivity.rollAttack).toHaveBeenCalledWith(
        { disadvantage: true },
        { configure: false },
        { create: false }
      );
    });

    it('should send to chat when showInChat is true', async () => {
      await rollAttackHandler({
        actorId: 'actor-123',
        itemId: 'item-123',
        showInChat: true
      });

      expect(mockAttackActivity.rollAttack).toHaveBeenCalledWith(
        {},
        { configure: false },
        { create: true }
      );
    });

    it('should detect critical on natural 20', async () => {
      mockRoll.total = 25;
      mockRoll.isCritical = true;
      mockRoll.terms = [{ faces: 20, number: 1, results: [{ result: 20 }] }];

      const result = await rollAttackHandler({
        actorId: 'actor-123',
        itemId: 'item-123'
      });

      expect(result.isCritical).toBe(true);
      expect(result.isFumble).toBeUndefined();
    });

    it('should detect fumble on natural 1', async () => {
      mockRoll.total = 6;
      mockRoll.isFumble = true;
      mockRoll.terms = [{ faces: 20, number: 1, results: [{ result: 1 }] }];

      const result = await rollAttackHandler({
        actorId: 'actor-123',
        itemId: 'item-123'
      });

      expect(result.isCritical).toBeUndefined();
      expect(result.isFumble).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should throw error if actor not found', async () => {
      mockGame.actors.get.mockReturnValue(undefined);

      await expect(
        rollAttackHandler({ actorId: 'non-existent', itemId: 'item-123' })
      ).rejects.toThrow('Actor not found: non-existent');
    });

    it('should throw error if item not found', async () => {
      mockActor.items.get.mockReturnValue(undefined);

      await expect(
        rollAttackHandler({ actorId: 'actor-123', itemId: 'non-existent' })
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
        rollAttackHandler({ actorId: 'actor-123', itemId: 'item-123' })
      ).rejects.toThrow('Item has no activities: Broken Item');
    });

    it('should throw error if item has no attack activity', async () => {
      mockItem.system.activities.find.mockReturnValue(undefined);

      await expect(
        rollAttackHandler({ actorId: 'actor-123', itemId: 'item-123' })
      ).rejects.toThrow('Item has no attack activity: Hand Crossbow');
    });

    it('should throw error if roll returns null', async () => {
      mockAttackActivity.rollAttack.mockResolvedValue(null);

      await expect(
        rollAttackHandler({ actorId: 'actor-123', itemId: 'item-123' })
      ).rejects.toThrow('Attack roll returned no results');
    });

    it('should throw error if roll returns empty array', async () => {
      mockAttackActivity.rollAttack.mockResolvedValue([]);

      await expect(
        rollAttackHandler({ actorId: 'actor-123', itemId: 'item-123' })
      ).rejects.toThrow('Attack roll returned no results');
    });
  });
});