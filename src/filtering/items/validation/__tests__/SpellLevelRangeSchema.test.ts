import { spellLevelRangeSchema } from '../SpellLevelRangeSchema';

describe('spellLevelRangeSchema', () => {
  it('accepts level 0 (cantrip)', () => {
    expect(spellLevelRangeSchema.safeParse({ min: 0 }).success).toBe(true);
  });

  it('accepts level 9 (highest)', () => {
    expect(spellLevelRangeSchema.safeParse({ max: 9 }).success).toBe(true);
  });

  it('accepts the full range [0, 9]', () => {
    expect(spellLevelRangeSchema.safeParse({ min: 0, max: 9 }).success).toBe(true);
  });

  it('rejects level 10 (above MAX)', () => {
    expect(spellLevelRangeSchema.safeParse({ min: 0, max: 10 }).success).toBe(false);
  });

  it('rejects negative level', () => {
    expect(spellLevelRangeSchema.safeParse({ min: -1 }).success).toBe(false);
  });

  it('rejects fractional level', () => {
    expect(spellLevelRangeSchema.safeParse({ min: 1.5 }).success).toBe(false);
  });

  it('rejects empty object', () => {
    expect(spellLevelRangeSchema.safeParse({}).success).toBe(false);
  });

  it('rejects min > max', () => {
    expect(spellLevelRangeSchema.safeParse({ min: 5, max: 2 }).success).toBe(false);
  });
});
