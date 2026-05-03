import { weightRangeSchema } from '../WeightRangeSchema';

describe('weightRangeSchema', () => {
  it('accepts a non-negative range', () => {
    expect(weightRangeSchema.safeParse({ min: 0, max: 100 }).success).toBe(true);
  });

  it('accepts a fractional bound', () => {
    expect(weightRangeSchema.safeParse({ min: 0.5 }).success).toBe(true);
  });

  it('accepts only min', () => {
    expect(weightRangeSchema.safeParse({ min: 1 }).success).toBe(true);
  });

  it('accepts only max', () => {
    expect(weightRangeSchema.safeParse({ max: 100 }).success).toBe(true);
  });

  it('rejects negative min', () => {
    expect(weightRangeSchema.safeParse({ min: -1 }).success).toBe(false);
  });

  it('rejects empty object (must specify min or max)', () => {
    expect(weightRangeSchema.safeParse({}).success).toBe(false);
  });

  it('rejects min > max', () => {
    expect(weightRangeSchema.safeParse({ min: 10, max: 5 }).success).toBe(false);
  });

  it('rejects non-numeric values', () => {
    expect(weightRangeSchema.safeParse({ min: '5' }).success).toBe(false);
  });
});
