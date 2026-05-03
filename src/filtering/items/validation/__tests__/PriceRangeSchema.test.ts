import { priceRangeSchema } from '../PriceRangeSchema';

describe('priceRangeSchema', () => {
  it('accepts a non-negative range', () => {
    expect(priceRangeSchema.safeParse({ min: 0, max: 1000 }).success).toBe(true);
  });

  it('accepts a fractional bound', () => {
    expect(priceRangeSchema.safeParse({ min: 0.5 }).success).toBe(true);
  });

  it('rejects negative min', () => {
    expect(priceRangeSchema.safeParse({ min: -1 }).success).toBe(false);
  });

  it('rejects empty object', () => {
    expect(priceRangeSchema.safeParse({}).success).toBe(false);
  });

  it('rejects min > max', () => {
    expect(priceRangeSchema.safeParse({ min: 100, max: 10 }).success).toBe(false);
  });
});
