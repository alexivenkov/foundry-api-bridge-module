import { rollSaveHandler } from '@/commands/handlers/RollSaveHandler';
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
  rollSavingThrow: jest.fn()
};

const mockGame = {
  actors: {
    get: jest.fn()
  }
};

(global as Record<string, unknown>)['game'] = mockGame;

describe('rollSaveHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGame.actors.get.mockReturnValue(mockActor);
    mockActor.rollSavingThrow.mockResolvedValue([mockRoll]);
    mockRoll.total = 14;
    mockRoll.formula = '1d20 + 3';
    mockRoll.terms = [{ faces: 20, number: 1, results: [{ result: 11 }] }];
    mockRoll.isCritical = false;
    mockRoll.isFumble = false;
  });

  describe('successful rolls', () => {
    it('should roll saving throw and return result', async () => {
      const result = await rollSaveHandler({
        actorId: 'actor-123',
        ability: 'dex'
      });

      expect(mockGame.actors.get).toHaveBeenCalledWith('actor-123');
      expect(mockActor.rollSavingThrow).toHaveBeenCalledWith(
        { ability: 'dex' },
        { configure: false },
        { create: false }
      );
      expect(result).toEqual({
        total: 14,
        formula: '1d20 + 3',
        dice: [{ type: 'd20', count: 1, results: [11] }]
      });
    });

    it('should send to chat when showInChat is true', async () => {
      await rollSaveHandler({
        actorId: 'actor-123',
        ability: 'con',
        showInChat: true
      });

      expect(mockActor.rollSavingThrow).toHaveBeenCalledWith(
        { ability: 'con' },
        { configure: false },
        { create: true }
      );
    });

    it('should detect critical on natural 20', async () => {
      mockRoll.total = 23;
      mockRoll.isCritical = true;
      mockRoll.terms = [{ faces: 20, number: 1, results: [{ result: 20 }] }];

      const result = await rollSaveHandler({
        actorId: 'actor-123',
        ability: 'wis'
      });

      expect(result.isCritical).toBe(true);
      expect(result.isFumble).toBeUndefined();
    });

    it('should detect fumble on natural 1', async () => {
      mockRoll.total = 4;
      mockRoll.isFumble = true;
      mockRoll.terms = [{ faces: 20, number: 1, results: [{ result: 1 }] }];

      const result = await rollSaveHandler({
        actorId: 'actor-123',
        ability: 'str'
      });

      expect(result.isCritical).toBeUndefined();
      expect(result.isFumble).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should throw error if actor not found', async () => {
      mockGame.actors.get.mockReturnValue(undefined);

      await expect(
        rollSaveHandler({ actorId: 'non-existent', ability: 'dex' })
      ).rejects.toThrow('Actor not found: non-existent');
    });

    it('should throw error for invalid ability key', async () => {
      await expect(
        rollSaveHandler({ actorId: 'actor-123', ability: 'invalid' as AbilityKey })
      ).rejects.toThrow(/Invalid ability key: invalid/);
    });

    it('should throw error if roll returns empty array', async () => {
      mockActor.rollSavingThrow.mockResolvedValue([]);

      await expect(
        rollSaveHandler({ actorId: 'actor-123', ability: 'dex' })
      ).rejects.toThrow('Saving throw roll returned no results');
    });
  });

  describe('ability keys', () => {
    it('should accept all valid D&D 5e ability keys', async () => {
      for (const ability of ABILITY_KEYS) {
        mockActor.rollSavingThrow.mockResolvedValue([mockRoll]);

        await expect(
          rollSaveHandler({ actorId: 'actor-123', ability })
        ).resolves.toBeDefined();
      }
    });

    it('should have 6 ability keys (D&D 5e standard)', () => {
      expect(ABILITY_KEYS).toHaveLength(6);
    });
  });
});