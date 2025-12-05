import { rollAbilityHandler } from '../RollAbilityHandler';
import { ABILITY_KEYS } from '@/commands/types';
import type { AbilityKey } from '@/commands/types';

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
  rollAbilityCheck: jest.fn()
};

const mockGame = {
  actors: {
    get: jest.fn()
  }
};

(global as Record<string, unknown>)['game'] = mockGame;

describe('rollAbilityHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGame.actors.get.mockReturnValue(mockActor);
    mockActor.rollAbilityCheck.mockResolvedValue([mockRoll]);
    mockRoll.total = 16;
    mockRoll.formula = '1d20 + 2';
    mockRoll.terms = [{ faces: 20, number: 1, results: [{ result: 14 }] }];
    mockRoll.isCritical = false;
    mockRoll.isFumble = false;
  });

  describe('successful rolls', () => {
    it('should roll ability check and return result', async () => {
      const result = await rollAbilityHandler({
        actorId: 'actor-123',
        ability: 'str'
      });

      expect(mockGame.actors.get).toHaveBeenCalledWith('actor-123');
      expect(mockActor.rollAbilityCheck).toHaveBeenCalledWith(
        { ability: 'str' },
        { configure: false },
        { create: false }
      );
      expect(result).toEqual({
        total: 16,
        formula: '1d20 + 2',
        dice: [{ type: 'd20', count: 1, results: [14] }]
      });
    });

    it('should send to chat when showInChat is true', async () => {
      await rollAbilityHandler({
        actorId: 'actor-123',
        ability: 'int',
        showInChat: true
      });

      expect(mockActor.rollAbilityCheck).toHaveBeenCalledWith(
        { ability: 'int' },
        { configure: false },
        { create: true }
      );
    });

    it('should detect critical on natural 20', async () => {
      mockRoll.total = 22;
      mockRoll.isCritical = true;
      mockRoll.terms = [{ faces: 20, number: 1, results: [{ result: 20 }] }];

      const result = await rollAbilityHandler({
        actorId: 'actor-123',
        ability: 'dex'
      });

      expect(result.isCritical).toBe(true);
      expect(result.isFumble).toBeUndefined();
    });

    it('should detect fumble on natural 1', async () => {
      mockRoll.total = 3;
      mockRoll.isFumble = true;
      mockRoll.terms = [{ faces: 20, number: 1, results: [{ result: 1 }] }];

      const result = await rollAbilityHandler({
        actorId: 'actor-123',
        ability: 'con'
      });

      expect(result.isCritical).toBeUndefined();
      expect(result.isFumble).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should throw error if actor not found', async () => {
      mockGame.actors.get.mockReturnValue(undefined);

      await expect(
        rollAbilityHandler({ actorId: 'non-existent', ability: 'str' })
      ).rejects.toThrow('Actor not found: non-existent');
    });

    it('should throw error for invalid ability key', async () => {
      await expect(
        rollAbilityHandler({ actorId: 'actor-123', ability: 'invalid' as AbilityKey })
      ).rejects.toThrow(/Invalid ability key: invalid/);
    });

    it('should throw error if roll returns empty array', async () => {
      mockActor.rollAbilityCheck.mockResolvedValue([]);

      await expect(
        rollAbilityHandler({ actorId: 'actor-123', ability: 'str' })
      ).rejects.toThrow('Ability check roll returned no results');
    });
  });

  describe('ability keys', () => {
    it('should accept all valid D&D 5e ability keys', async () => {
      for (const ability of ABILITY_KEYS) {
        mockActor.rollAbilityCheck.mockResolvedValue([mockRoll]);

        await expect(
          rollAbilityHandler({ actorId: 'actor-123', ability })
        ).resolves.toBeDefined();
      }
    });

    it('should have 6 ability keys (D&D 5e standard)', () => {
      expect(ABILITY_KEYS).toHaveLength(6);
    });
  });
});