import { dnd5eRollPerceptionHandler as rollPerceptionHandler } from '../Dnd5eRollPerceptionHandler';

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

const mockActor = {
  id: 'actor-123',
  name: 'Test Actor',
  rollSkill: jest.fn()
};

const mockGame = {
  actors: {
    get: jest.fn()
  },
  system: { id: 'dnd5e' }
};

(global as Record<string, unknown>)['game'] = mockGame;

describe('rollPerceptionHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGame.actors.get.mockReturnValue(mockActor);
    mockActor.rollSkill.mockResolvedValue([mockRoll]);
    mockRoll.total = 17;
    mockRoll.formula = '1d20 + 4';
    mockRoll.terms = [{ faces: 20, number: 1, results: [{ result: 13 }] }];
    mockRoll.isCritical = false;
    mockRoll.isFumble = false;
  });

  describe('successful rolls', () => {
    it('should roll the perception skill and return result', async () => {
      const result = await rollPerceptionHandler({ actorId: 'actor-123' });

      expect(mockGame.actors.get).toHaveBeenCalledWith('actor-123');
      expect(mockActor.rollSkill).toHaveBeenCalledWith(
        { skill: 'prc' },
        { configure: false },
        { create: false }
      );
      expect(result).toEqual({
        total: 17,
        formula: '1d20 + 4',
        dice: [{ type: 'd20', count: 1, results: [13] }]
      });
    });

    it('should send to chat when showInChat is true', async () => {
      await rollPerceptionHandler({ actorId: 'actor-123', showInChat: true });

      expect(mockActor.rollSkill).toHaveBeenCalledWith(
        { skill: 'prc' },
        { configure: false },
        { create: true }
      );
    });

    it('should detect critical on natural 20', async () => {
      mockRoll.total = 24;
      mockRoll.isCritical = true;
      mockRoll.terms = [{ faces: 20, number: 1, results: [{ result: 20 }] }];

      const result = await rollPerceptionHandler({ actorId: 'actor-123' });

      expect(result.isCritical).toBe(true);
      expect(result.isFumble).toBeUndefined();
    });
  });

  describe('advantage and disadvantage', () => {
    it('should pass advantage to rollSkill', async () => {
      await rollPerceptionHandler({ actorId: 'actor-123', advantage: true });

      expect(mockActor.rollSkill).toHaveBeenCalledWith(
        { skill: 'prc', advantage: true },
        { configure: false },
        { create: false }
      );
    });

    it('should pass disadvantage to rollSkill', async () => {
      mockRoll.formula = '2d20kl + 4';
      mockRoll.terms = [{ faces: 20, number: 2, results: [{ result: 13 }, { result: 2 }] }];

      const result = await rollPerceptionHandler({ actorId: 'actor-123', disadvantage: true });

      expect(mockActor.rollSkill).toHaveBeenCalledWith(
        { skill: 'prc', disadvantage: true },
        { configure: false },
        { create: false }
      );
      expect(result.formula).toBe('2d20kl + 4');
      expect(result.dice[0]?.results).toEqual([13, 2]);
    });

    it('should not add the flags to the config when they are false', async () => {
      await rollPerceptionHandler({ actorId: 'actor-123', advantage: false, disadvantage: false });

      expect(mockActor.rollSkill.mock.calls[0]?.[0]).toStrictEqual({ skill: 'prc' });
    });

    it('should reject advantage and disadvantage together without rolling', async () => {
      await expect(
        rollPerceptionHandler({ actorId: 'actor-123', advantage: true, disadvantage: true })
      ).rejects.toThrow('Cannot have both advantage and disadvantage');

      expect(mockActor.rollSkill).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should throw error if actor not found', async () => {
      mockGame.actors.get.mockReturnValue(undefined);

      await expect(
        rollPerceptionHandler({ actorId: 'non-existent' })
      ).rejects.toThrow('Actor not found: non-existent');
    });

    it('should throw error if roll returns empty array', async () => {
      mockActor.rollSkill.mockResolvedValue([]);

      await expect(
        rollPerceptionHandler({ actorId: 'actor-123' })
      ).rejects.toThrow('Perception roll returned no results');
    });
  });
});
