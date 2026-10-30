import { computeCoc7Ranges, resolveCoc7Check, type Coc7CheckInput } from '../Coc7CheckRoll';

const regular = (threshold: number, overrides: Partial<Coc7CheckInput> = {}): Coc7CheckInput => ({
  threshold,
  difficulty: 'regular',
  bonusDice: 0,
  penaltyDice: 0,
  flatDiceModifier: 0,
  flatThresholdModifier: 0,
  ...overrides
});

describe('computeCoc7Ranges', () => {
  it.each([
    [70, { critical: [1, 1], extreme: [2, 14], hard: [15, 35], regular: [36, 70], failure: [71, 99], fumble: [100, 100] }],
    [45, { critical: [1, 1], extreme: [2, 9], hard: [10, 22], regular: [23, 45], failure: [46, 95], fumble: [96, 100] }],
    [7, { critical: [1, 1], hard: [2, 3], regular: [4, 7], failure: [8, 95], fumble: [96, 100] }],
    [3, { critical: [1, 1], regular: [2, 3], failure: [4, 95], fumble: [96, 100] }],
    [1, { critical: [1, 1], failure: [2, 95], fumble: [96, 100] }],
    [0, { critical: [1, 1], failure: [2, 95], fumble: [96, 100] }]
  ])('threshold %i at regular difficulty', (threshold, expected) => {
    const ranges = computeCoc7Ranges(threshold, 0, 'regular');
    const actual: Record<string, [number, number]> = {};
    for (const key of ['critical', 'extreme', 'hard', 'regular', 'failure', 'fumble'] as const) {
      const range = ranges[key];
      if (range) actual[key] = [range.min, range.max];
    }
    expect(actual).toEqual(expected);
  });

  it('moves the fumble to 96 at hard difficulty when half the threshold is under 50', () => {
    expect(computeCoc7Ranges(70, 0, 'hard').fumbleFrom).toBe(96);
    expect(computeCoc7Ranges(100, 0, 'hard').fumbleFrom).toBe(100);
    expect(computeCoc7Ranges(70, 0, 'extreme').fumbleFrom).toBe(96);
    expect(computeCoc7Ranges(70, 0, 'critical').fumbleFrom).toBe(100);
    expect(computeCoc7Ranges(70, 0, 'unknown').fumbleFrom).toBe(100);
  });

  it('applies the flat threshold modifier and caps the regular level at the fumble', () => {
    const ranges = computeCoc7Ranges(45, 10, 'regular');
    expect(ranges.regular).toEqual({ min: 28, max: 55 });
    expect(ranges.fumbleFrom).toBe(100);
    const capped = computeCoc7Ranges(120, 0, 'regular');
    expect(capped.regular).toEqual({ min: 61, max: 99 });
    expect(capped.failure).toBeUndefined();
  });
});

describe('resolveCoc7Check', () => {
  it.each([
    [[4], 10, 40],
    [[10], 10, 100],
    [[10], 7, 7],
    [[9], 9, 99]
  ])('reads tens %j and unit %i as %i', (tens, unit, total) => {
    expect(resolveCoc7Check(regular(70), { tens, unit }).total).toBe(total);
  });

  it('keeps the lowest candidate with a bonus die and the highest with a penalty die', () => {
    const bonus = resolveCoc7Check(regular(70, { bonusDice: 1 }), { tens: [4, 10], unit: 7 });
    expect(bonus.total).toBe(7);
    expect(bonus.dice.tens).toEqual([
      { value: 40, kept: false },
      { value: 0, kept: true }
    ]);
    const penalty = resolveCoc7Check(regular(70, { penaltyDice: 1 }), { tens: [4, 10], unit: 7 });
    expect(penalty.total).toBe(47);
    expect(penalty.dice.tens).toEqual([
      { value: 40, kept: true },
      { value: 0, kept: false }
    ]);
    expect(penalty.dice).toMatchObject({ unit: 7, bonusDice: 0, penaltyDice: 1 });
  });

  it('marks the first die on ties', () => {
    const tie = resolveCoc7Check(regular(70, { bonusDice: 2 }), { tens: [3, 3, 5], unit: 2 });
    expect(tie.total).toBe(32);
    expect(tie.dice.tens.map((die) => die.kept)).toEqual([true, false, false]);
  });

  it('clamps the flat dice modifier to 1..100 and lets it fumble', () => {
    expect(resolveCoc7Check(regular(45, { flatDiceModifier: -10 }), { tens: [10], unit: 5 }).total).toBe(1);
    const pushed = resolveCoc7Check(regular(45, { flatDiceModifier: 10 }), { tens: [9], unit: 5 });
    expect(pushed.total).toBe(100);
    expect(pushed.outcome).toBe('fumble');
    expect(pushed.isFumble).toBe(true);
  });

  it.each([
    [1, 'critical', 4, true, true, false],
    [14, 'extreme', 3, true, false, false],
    [35, 'hard', 2, true, false, false],
    [70, 'regular', 1, true, false, false],
    [71, 'failure', 0, false, false, false],
    [100, 'fumble', -99, false, false, true]
  ])('total %i against 70 is %s', (total, outcome, level, success, critical, fumble) => {
    const tens = Math.floor(total / 10) % 10;
    const unit = total % 10;
    const result = resolveCoc7Check(regular(70), { tens: [tens === 0 ? 10 : tens], unit: unit === 0 ? 10 : unit });
    expect(result.total).toBe(total);
    expect(result.outcome).toBe(outcome);
    expect(result.successLevel).toBe(level);
    expect(result.isSuccess).toBe(success);
    expect(result.isCritical).toBe(critical);
    expect(result.isFumble).toBe(fumble);
  });

  it('judges success against the difficulty and reports the Luck needed per level', () => {
    const hard = resolveCoc7Check(regular(70, { difficulty: 'hard' }), { tens: [2], unit: 10 });
    expect(hard).toMatchObject({ total: 20, outcome: 'hard', isSuccess: true, thresholds: { regular: 70, hard: 35, extreme: 14, fumbleFrom: 96 } });
    const regularOnly = resolveCoc7Check(regular(70, { difficulty: 'hard' }), { tens: [4], unit: 10 });
    expect(regularOnly).toMatchObject({ total: 40, outcome: 'regular', isSuccess: false, luckRequired: { regular: 0, hard: 5, extreme: 26 } });
    expect(regularOnly.isRolledSuccess).toBe(false);
  });

  it('answers null success at unknown difficulty while still naming the level', () => {
    const result = resolveCoc7Check(regular(45, { difficulty: 'unknown' }), { tens: [3], unit: 3 });
    expect(result).toMatchObject({ total: 33, outcome: 'regular', isSuccess: null, isRolledSuccess: false });
  });

  it('reports 0 Luck for levels that do not exist', () => {
    const result = resolveCoc7Check(regular(3), { tens: [5], unit: 5 });
    expect(result.thresholds).toEqual({ regular: 3, hard: 0, extreme: 0, fumbleFrom: 96 });
    expect(result.luckRequired).toEqual({ regular: 52, hard: 0, extreme: 0 });
  });

  it('counts a rolled success only without pool dice', () => {
    expect(resolveCoc7Check(regular(70), { tens: [4], unit: 2 }).isRolledSuccess).toBe(true);
    expect(resolveCoc7Check(regular(70, { bonusDice: 1 }), { tens: [4, 5], unit: 2 }).isRolledSuccess).toBe(false);
    expect(resolveCoc7Check(regular(70, { penaltyDice: 1 }), { tens: [4, 2], unit: 2 }).isRolledSuccess).toBe(false);
  });

  it('refuses bonus and penalty dice together and a mismatched pool', () => {
    expect(() => resolveCoc7Check(regular(70, { bonusDice: 1, penaltyDice: 1 }), { tens: [1, 2, 3], unit: 1 })).toThrow(
      'bonusDice and penaltyDice are exclusive'
    );
    expect(() => resolveCoc7Check(regular(70, { bonusDice: 1 }), { tens: [1], unit: 1 })).toThrow('Expected 2 tens dice, got 1');
  });
});
