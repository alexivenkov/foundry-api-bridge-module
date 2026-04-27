import { abilityScoresSchema } from '../AbilityScoresSchema';

describe('abilityScoresSchema', () => {
  it('accepts a single ability range (str)', () => {
    const result = abilityScoresSchema.safeParse({ str: { min: 12 } });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.str).toEqual({ min: 12 });
  });

  it('accepts ranges for all six abilities', () => {
    const result = abilityScoresSchema.safeParse({
      str: { min: 10, max: 20 },
      dex: { min: 8 },
      con: { max: 18 },
      int: { min: 6, max: 14 },
      wis: { min: 10 },
      cha: { max: 16 }
    });
    expect(result.success).toBe(true);
  });

  it('accepts each ability key individually (str)', () => {
    expect(abilityScoresSchema.safeParse({ str: { min: 10 } }).success).toBe(true);
  });

  it('accepts each ability key individually (dex)', () => {
    expect(abilityScoresSchema.safeParse({ dex: { min: 10 } }).success).toBe(true);
  });

  it('accepts each ability key individually (con)', () => {
    expect(abilityScoresSchema.safeParse({ con: { min: 10 } }).success).toBe(true);
  });

  it('accepts each ability key individually (int)', () => {
    expect(abilityScoresSchema.safeParse({ int: { min: 10 } }).success).toBe(true);
  });

  it('accepts each ability key individually (wis)', () => {
    expect(abilityScoresSchema.safeParse({ wis: { min: 10 } }).success).toBe(true);
  });

  it('accepts each ability key individually (cha)', () => {
    expect(abilityScoresSchema.safeParse({ cha: { min: 10 } }).success).toBe(true);
  });

  it('rejects an empty abilities object', () => {
    const result = abilityScoresSchema.safeParse({});
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.message).toBe(
      'abilities must specify at least one ability range'
    );
  });

  it('rejects a fractional ability score', () => {
    const result = abilityScoresSchema.safeParse({ str: { min: 12.5 } });
    expect(result.success).toBe(false);
  });

  it('rejects a negative ability score', () => {
    const result = abilityScoresSchema.safeParse({ str: { min: -1 } });
    expect(result.success).toBe(false);
  });

  it('accepts ability score of zero (minBound: 0)', () => {
    expect(abilityScoresSchema.safeParse({ str: { min: 0 } }).success).toBe(true);
  });

  it('rejects an inverted range (min > max)', () => {
    const result = abilityScoresSchema.safeParse({ str: { min: 18, max: 10 } });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.message).toBe('min (18) must be <= max (10)');
  });

  it('rejects an empty range object inside an ability', () => {
    const result = abilityScoresSchema.safeParse({ str: {} });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.message).toBe('range must specify at least min or max');
  });

  it('rejects a non-number ability score', () => {
    expect(abilityScoresSchema.safeParse({ str: { min: 'abc' } }).success).toBe(false);
  });
});
