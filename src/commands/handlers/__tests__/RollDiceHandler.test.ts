import { rollDiceHandler } from '@/commands/handlers/RollDiceHandler';

interface MockRollInstance {
  evaluate: jest.Mock;
  toMessage: jest.Mock;
  total: number;
  formula: string;
  terms: Array<{
    faces?: number;
    number?: number;
    results?: Array<{ result: number; active?: boolean }>;
  }>;
  dice?: Array<{ number?: unknown }>;
}

const mockRollInstance: MockRollInstance = {
  evaluate: jest.fn(),
  toMessage: jest.fn(),
  total: 0,
  formula: '',
  terms: []
};

const MockRoll = jest.fn().mockImplementation(() => mockRollInstance);

(global as Record<string, unknown>)['Roll'] = MockRoll;

describe('rollDiceHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete mockRollInstance.dice;
    mockRollInstance.evaluate.mockResolvedValue(mockRollInstance);
    mockRollInstance.toMessage.mockResolvedValue(undefined);
  });

  describe('size guards', () => {
    it('rejects an empty formula before touching Roll', async () => {
      await expect(rollDiceHandler({ formula: '   ' })).rejects.toThrow('Roll formula is required');
      expect(MockRoll).not.toHaveBeenCalled();
    });

    it('rejects a formula longer than 200 characters before touching Roll', async () => {
      const formula = '1d6+'.repeat(60) + '1';
      await expect(rollDiceHandler({ formula })).rejects.toThrow('Roll formula is too long (241 > 200 characters)');
      expect(MockRoll).not.toHaveBeenCalled();
    });

    it('rejects more than 1000 dice without evaluating', async () => {
      mockRollInstance.dice = [{ number: 600 }, { number: 401 }];
      await expect(rollDiceHandler({ formula: '600d20+401d6' })).rejects.toThrow('Roll formula asks for too many dice (1001 > 1000)');
      expect(mockRollInstance.evaluate).not.toHaveBeenCalled();
    });

    it('counts a die term with a non-numeric count as one die', async () => {
      mockRollInstance.dice = [{ number: undefined }, { number: '(1d4)' }];
      mockRollInstance.total = 3;
      mockRollInstance.formula = '(1d4)d6';
      mockRollInstance.terms = [];

      await expect(rollDiceHandler({ formula: '(1d4)d6' })).resolves.toEqual({ total: 3, formula: '(1d4)d6', dice: [] });
    });

    it('allows exactly 1000 dice', async () => {
      mockRollInstance.dice = [{ number: 1000 }];
      mockRollInstance.total = 3500;
      mockRollInstance.formula = '1000d6';
      mockRollInstance.terms = [];

      await expect(rollDiceHandler({ formula: '1000d6' })).resolves.toEqual({ total: 3500, formula: '1000d6', dice: [] });
      expect(mockRollInstance.evaluate).toHaveBeenCalled();
    });
  });

  it('should roll dice and return result', async () => {
    mockRollInstance.total = 15;
    mockRollInstance.formula = '2d6+3';
    mockRollInstance.terms = [
      { faces: 6, number: 2, results: [{ result: 5 }, { result: 7 }] }
    ];

    const result = await rollDiceHandler({ formula: '2d6+3' });

    expect(MockRoll).toHaveBeenCalledWith('2d6+3');
    expect(mockRollInstance.evaluate).toHaveBeenCalled();
    expect(result).toEqual({
      total: 15,
      formula: '2d6+3',
      dice: [{ type: 'd6', count: 2, results: [5, 7] }]
    });
  });

  it('should send to chat when showInChat is true', async () => {
    mockRollInstance.total = 10;
    mockRollInstance.formula = '1d20';
    mockRollInstance.terms = [{ faces: 20, number: 1, results: [{ result: 10 }] }];

    await rollDiceHandler({ formula: '1d20', showInChat: true, flavor: 'Attack' });

    expect(mockRollInstance.toMessage).toHaveBeenCalledWith({ flavor: 'Attack' });
  });

  it('should not send to chat when showInChat is false', async () => {
    mockRollInstance.total = 10;
    mockRollInstance.formula = '1d20';
    mockRollInstance.terms = [];

    await rollDiceHandler({ formula: '1d20', showInChat: false });

    expect(mockRollInstance.toMessage).not.toHaveBeenCalled();
  });

  it('should detect critical on natural 20', async () => {
    mockRollInstance.total = 20;
    mockRollInstance.formula = '1d20';
    mockRollInstance.terms = [{ faces: 20, number: 1, results: [{ result: 20 }] }];

    const result = await rollDiceHandler({ formula: '1d20' });

    expect(result.isCritical).toBe(true);
    expect(result.isFumble).toBeUndefined();
  });

  it('should detect fumble on natural 1', async () => {
    mockRollInstance.total = 1;
    mockRollInstance.formula = '1d20';
    mockRollInstance.terms = [{ faces: 20, number: 1, results: [{ result: 1 }] }];

    const result = await rollDiceHandler({ formula: '1d20' });

    expect(result.isCritical).toBeUndefined();
    expect(result.isFumble).toBe(true);
  });

  it('should not include critical flags for non-d20 rolls', async () => {
    mockRollInstance.total = 12;
    mockRollInstance.formula = '2d6';
    mockRollInstance.terms = [{ faces: 6, number: 2, results: [{ result: 6 }, { result: 6 }] }];

    const result = await rollDiceHandler({ formula: '2d6' });

    expect(result.isCritical).toBeUndefined();
    expect(result.isFumble).toBeUndefined();
  });

  it('should handle complex formulas with multiple dice', async () => {
    mockRollInstance.total = 25;
    mockRollInstance.formula = '2d6+1d8+5';
    mockRollInstance.terms = [
      { faces: 6, number: 2, results: [{ result: 4 }, { result: 5 }] },
      { faces: 8, number: 1, results: [{ result: 6 }] }
    ];

    const result = await rollDiceHandler({ formula: '2d6+1d8+5' });

    expect(result.dice).toEqual([
      { type: 'd6', count: 2, results: [4, 5] },
      { type: 'd8', count: 1, results: [6] }
    ]);
  });

  it('should ignore non-dice terms', async () => {
    mockRollInstance.total = 10;
    mockRollInstance.formula = '1d6+4';
    mockRollInstance.terms = [
      { faces: 6, number: 1, results: [{ result: 6 }] },
      {}
    ];

    const result = await rollDiceHandler({ formula: '1d6+4' });

    expect(result.dice).toEqual([{ type: 'd6', count: 1, results: [6] }]);
  });

  it('should detect critical on advantage (2d20kh1) when kept die is 20', async () => {
    mockRollInstance.total = 20;
    mockRollInstance.formula = '2d20kh1';
    mockRollInstance.terms = [
      {
        faces: 20,
        number: 2,
        results: [
          { result: 20, active: true },
          { result: 5, active: false }
        ]
      }
    ];

    const result = await rollDiceHandler({ formula: '2d20kh1' });

    expect(result.isCritical).toBe(true);
    expect(result.isFumble).toBeUndefined();
  });

  it('should NOT detect critical on disadvantage (2d20kl1) when discarded die is 20', async () => {
    mockRollInstance.total = 5;
    mockRollInstance.formula = '2d20kl1';
    mockRollInstance.terms = [
      {
        faces: 20,
        number: 2,
        results: [
          { result: 20, active: false },
          { result: 5, active: true }
        ]
      }
    ];

    const result = await rollDiceHandler({ formula: '2d20kl1' });

    expect(result.isCritical).toBeUndefined();
    expect(result.isFumble).toBeUndefined();
  });

  it('should detect fumble on disadvantage (2d20kl1) when kept die is 1', async () => {
    mockRollInstance.total = 1;
    mockRollInstance.formula = '2d20kl1';
    mockRollInstance.terms = [
      {
        faces: 20,
        number: 2,
        results: [
          { result: 1, active: true },
          { result: 18, active: false }
        ]
      }
    ];

    const result = await rollDiceHandler({ formula: '2d20kl1' });

    expect(result.isFumble).toBe(true);
    expect(result.isCritical).toBeUndefined();
  });

  it('should NOT detect fumble on advantage (2d20kh1) when discarded die is 1', async () => {
    mockRollInstance.total = 18;
    mockRollInstance.formula = '2d20kh1';
    mockRollInstance.terms = [
      {
        faces: 20,
        number: 2,
        results: [
          { result: 1, active: false },
          { result: 18, active: true }
        ]
      }
    ];

    const result = await rollDiceHandler({ formula: '2d20kh1' });

    expect(result.isFumble).toBeUndefined();
    expect(result.isCritical).toBeUndefined();
  });

  it('should detect critical on plain 2d20 (no kh/kl) when any kept die is 20', async () => {
    mockRollInstance.total = 27;
    mockRollInstance.formula = '2d20';
    mockRollInstance.terms = [
      {
        faces: 20,
        number: 2,
        results: [
          { result: 7, active: true },
          { result: 20, active: true }
        ]
      }
    ];

    const result = await rollDiceHandler({ formula: '2d20' });

    expect(result.isCritical).toBe(true);
  });

  it('should treat missing active flag as kept (backward compat)', async () => {
    mockRollInstance.total = 20;
    mockRollInstance.formula = '1d20';
    mockRollInstance.terms = [
      { faces: 20, number: 1, results: [{ result: 20 }] }
    ];

    const result = await rollDiceHandler({ formula: '1d20' });

    expect(result.isCritical).toBe(true);
  });
});