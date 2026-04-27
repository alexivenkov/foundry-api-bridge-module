import { dispositionArraySchema } from '../DispositionSchema';

describe('dispositionArraySchema', () => {
  it('accepts "hostile"', () => {
    expect(dispositionArraySchema.safeParse(['hostile']).success).toBe(true);
  });

  it('accepts "neutral"', () => {
    expect(dispositionArraySchema.safeParse(['neutral']).success).toBe(true);
  });

  it('accepts "friendly"', () => {
    expect(dispositionArraySchema.safeParse(['friendly']).success).toBe(true);
  });

  it('accepts "secret"', () => {
    expect(dispositionArraySchema.safeParse(['secret']).success).toBe(true);
  });

  it('accepts all four valid dispositions together', () => {
    const result = dispositionArraySchema.safeParse(['hostile', 'neutral', 'friendly', 'secret']);
    expect(result.success).toBe(true);
  });

  it('normalizes uppercase to lowercase', () => {
    const result = dispositionArraySchema.safeParse(['HOSTILE']);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toEqual(['hostile']);
  });

  it('normalizes mixed case', () => {
    const result = dispositionArraySchema.safeParse(['Friendly']);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toEqual(['friendly']);
  });

  it('trims surrounding whitespace', () => {
    const result = dispositionArraySchema.safeParse(['  neutral  ']);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toEqual(['neutral']);
  });

  it('rejects an empty array', () => {
    const result = dispositionArraySchema.safeParse([]);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.message).toBe('disposition array must not be empty');
  });

  it('rejects an unknown disposition', () => {
    const result = dispositionArraySchema.safeParse(['evil']);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.message).toBe("unknown disposition: 'evil'");
  });

  it('rejects a non-array input', () => {
    expect(dispositionArraySchema.safeParse('hostile').success).toBe(false);
  });

  it('rejects an array with non-string element', () => {
    expect(dispositionArraySchema.safeParse([123]).success).toBe(false);
  });

  it('attaches index path to invalid element', () => {
    const result = dispositionArraySchema.safeParse(['hostile', 'evil']);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.path).toEqual([1]);
  });
});
