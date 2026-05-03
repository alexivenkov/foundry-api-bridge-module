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
    mockRollInstance.evaluate.mockResolvedValue(mockRollInstance);
    mockRollInstance.toMessage.mockResolvedValue(undefined);
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