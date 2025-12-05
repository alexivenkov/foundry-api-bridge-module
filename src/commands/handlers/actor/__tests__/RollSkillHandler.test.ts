import { rollSkillHandler, SKILL_KEYS } from '../RollSkillHandler';

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
  }
};

(global as Record<string, unknown>)['game'] = mockGame;

describe('rollSkillHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGame.actors.get.mockReturnValue(mockActor);
    mockActor.rollSkill.mockResolvedValue([mockRoll]);
    mockRoll.total = 15;
    mockRoll.formula = '1d20 + 5';
    mockRoll.terms = [{ faces: 20, number: 1, results: [{ result: 10 }] }];
    mockRoll.isCritical = false;
    mockRoll.isFumble = false;
  });

  describe('successful rolls', () => {
    it('should roll skill and return result', async () => {
      const result = await rollSkillHandler({
        actorId: 'actor-123',
        skill: 'ste'
      });

      expect(mockGame.actors.get).toHaveBeenCalledWith('actor-123');
      expect(mockActor.rollSkill).toHaveBeenCalledWith(
        { skill: 'ste' },
        { configure: false },
        { create: false }
      );
      expect(result).toEqual({
        total: 15,
        formula: '1d20 + 5',
        dice: [{ type: 'd20', count: 1, results: [10] }]
      });
    });

    it('should send to chat when showInChat is true', async () => {
      await rollSkillHandler({
        actorId: 'actor-123',
        skill: 'prc',
        showInChat: true
      });

      expect(mockActor.rollSkill).toHaveBeenCalledWith(
        { skill: 'prc' },
        { configure: false },
        { create: true }
      );
    });

    it('should detect critical on natural 20', async () => {
      mockRoll.total = 25;
      mockRoll.isCritical = true;
      mockRoll.terms = [{ faces: 20, number: 1, results: [{ result: 20 }] }];

      const result = await rollSkillHandler({
        actorId: 'actor-123',
        skill: 'ath'
      });

      expect(result.isCritical).toBe(true);
      expect(result.isFumble).toBeUndefined();
    });

    it('should detect fumble on natural 1', async () => {
      mockRoll.total = 6;
      mockRoll.isFumble = true;
      mockRoll.terms = [{ faces: 20, number: 1, results: [{ result: 1 }] }];

      const result = await rollSkillHandler({
        actorId: 'actor-123',
        skill: 'ste'
      });

      expect(result.isCritical).toBeUndefined();
      expect(result.isFumble).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should throw error if actor not found', async () => {
      mockGame.actors.get.mockReturnValue(undefined);

      await expect(
        rollSkillHandler({ actorId: 'non-existent', skill: 'ste' })
      ).rejects.toThrow('Actor not found: non-existent');
    });

    it('should throw error for invalid skill key', async () => {
      await expect(
        rollSkillHandler({ actorId: 'actor-123', skill: 'invalid' })
      ).rejects.toThrow(/Invalid skill key: invalid/);
    });

    it('should throw error if roll returns empty array', async () => {
      mockActor.rollSkill.mockResolvedValue([]);

      await expect(
        rollSkillHandler({ actorId: 'actor-123', skill: 'ste' })
      ).rejects.toThrow('Skill roll returned no results');
    });
  });

  describe('skill keys', () => {
    it('should accept all valid D&D 5e skill keys', async () => {
      for (const skill of SKILL_KEYS) {
        mockActor.rollSkill.mockResolvedValue([mockRoll]);

        await expect(
          rollSkillHandler({ actorId: 'actor-123', skill })
        ).resolves.toBeDefined();
      }
    });

    it('should have 18 skill keys (D&D 5e standard)', () => {
      expect(SKILL_KEYS).toHaveLength(18);
    });
  });
});