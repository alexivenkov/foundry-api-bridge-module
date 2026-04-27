import { challengeRatingRangeSchema } from '../ChallengeRatingRangeSchema';

describe('challengeRatingRangeSchema', () => {
  it('accepts a single allowed CR for min', () => {
    expect(challengeRatingRangeSchema.safeParse({ min: 0.25 }).success).toBe(true);
  });

  it('accepts a single allowed CR for max', () => {
    expect(challengeRatingRangeSchema.safeParse({ max: 0.5 }).success).toBe(true);
  });

  it('accepts both min and max from the allowed list', () => {
    expect(challengeRatingRangeSchema.safeParse({ min: 0.25, max: 1 }).success).toBe(true);
  });

  it('accepts CR 0 (minimum allowed)', () => {
    expect(challengeRatingRangeSchema.safeParse({ min: 0 }).success).toBe(true);
  });

  it('accepts CR 30 (maximum allowed)', () => {
    expect(challengeRatingRangeSchema.safeParse({ max: 30 }).success).toBe(true);
  });

  it('accepts the fractional 0.125', () => {
    expect(challengeRatingRangeSchema.safeParse({ min: 0.125 }).success).toBe(true);
  });

  it('accepts integer CRs from 1 to 30', () => {
    for (let cr = 1; cr <= 30; cr += 1) {
      expect(challengeRatingRangeSchema.safeParse({ min: cr }).success).toBe(true);
    }
  });

  it('rejects a CR not in the allowed list (e.g., 0.7)', () => {
    const result = challengeRatingRangeSchema.safeParse({ min: 0.7 });
    expect(result.success).toBe(false);
  });

  it('rejects a CR not in the allowed list (e.g., 31)', () => {
    expect(challengeRatingRangeSchema.safeParse({ min: 31 }).success).toBe(false);
  });

  it('rejects an empty range (no bounds)', () => {
    const result = challengeRatingRangeSchema.safeParse({});
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.message).toBe('range must specify at least min or max');
  });

  it('rejects min > max', () => {
    const result = challengeRatingRangeSchema.safeParse({ min: 5, max: 1 });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.message).toBe('min (5) must be <= max (1)');
  });

  it('rejects negative CR', () => {
    expect(challengeRatingRangeSchema.safeParse({ min: -1 }).success).toBe(false);
  });

  it('rejects a non-number input for min', () => {
    expect(challengeRatingRangeSchema.safeParse({ min: '5' }).success).toBe(false);
  });
});
