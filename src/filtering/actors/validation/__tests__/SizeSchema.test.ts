import { sizeArraySchema } from '../SizeSchema';

describe('sizeArraySchema', () => {
  it('accepts the short code "tiny"', () => {
    const result = sizeArraySchema.safeParse(['tiny']);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toEqual(['tiny']);
  });

  it('accepts the short code "sm"', () => {
    const result = sizeArraySchema.safeParse(['sm']);
    expect(result.success).toBe(true);
  });

  it('accepts the short code "med"', () => {
    expect(sizeArraySchema.safeParse(['med']).success).toBe(true);
  });

  it('accepts the short code "lg"', () => {
    expect(sizeArraySchema.safeParse(['lg']).success).toBe(true);
  });

  it('accepts the short code "huge"', () => {
    expect(sizeArraySchema.safeParse(['huge']).success).toBe(true);
  });

  it('accepts the short code "grg"', () => {
    expect(sizeArraySchema.safeParse(['grg']).success).toBe(true);
  });

  it('accepts all six valid size codes together', () => {
    const result = sizeArraySchema.safeParse(['tiny', 'sm', 'med', 'lg', 'huge', 'grg']);
    expect(result.success).toBe(true);
  });

  it('rejects the long form "small" (only "sm" is valid)', () => {
    const result = sizeArraySchema.safeParse(['small']);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.message).toBe("unknown size: 'small'");
  });

  it('rejects the long form "medium"', () => {
    expect(sizeArraySchema.safeParse(['medium']).success).toBe(false);
  });

  it('rejects the long form "large"', () => {
    expect(sizeArraySchema.safeParse(['large']).success).toBe(false);
  });

  it('rejects the long form "gargantuan"', () => {
    expect(sizeArraySchema.safeParse(['gargantuan']).success).toBe(false);
  });

  it('normalizes uppercase to lowercase', () => {
    const result = sizeArraySchema.safeParse(['SM']);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toEqual(['sm']);
  });

  it('normalizes mixed case', () => {
    const result = sizeArraySchema.safeParse(['Med']);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toEqual(['med']);
  });

  it('trims surrounding whitespace', () => {
    const result = sizeArraySchema.safeParse(['  huge  ']);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toEqual(['huge']);
  });

  it('rejects an empty array', () => {
    const result = sizeArraySchema.safeParse([]);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.message).toBe('size array must not be empty');
  });

  it('rejects an unknown size code with a descriptive message', () => {
    const result = sizeArraySchema.safeParse(['enormous']);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.message).toBe("unknown size: 'enormous'");
  });

  it('rejects a non-array input', () => {
    expect(sizeArraySchema.safeParse('sm').success).toBe(false);
  });

  it('rejects an array with non-string element', () => {
    expect(sizeArraySchema.safeParse([123]).success).toBe(false);
  });

  it('attaches index path to invalid element', () => {
    const result = sizeArraySchema.safeParse(['sm', 'large']);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.path).toEqual([1]);
  });
});
