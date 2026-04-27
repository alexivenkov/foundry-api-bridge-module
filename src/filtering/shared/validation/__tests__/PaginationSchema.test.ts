import { paginationSchema } from '../PaginationSchema';

describe('paginationSchema', () => {
  it('accepts an empty object (everything optional)', () => {
    expect(paginationSchema.safeParse({}).success).toBe(true);
  });

  it('accepts a valid limit alone', () => {
    expect(paginationSchema.safeParse({ limit: 50 }).success).toBe(true);
  });

  it('accepts a valid offset alone', () => {
    expect(paginationSchema.safeParse({ offset: 0 }).success).toBe(true);
  });

  it('accepts both limit and offset together', () => {
    expect(paginationSchema.safeParse({ limit: 50, offset: 100 }).success).toBe(true);
  });

  it('accepts limit at lower bound (1)', () => {
    expect(paginationSchema.safeParse({ limit: 1 }).success).toBe(true);
  });

  it('accepts limit at upper bound (200)', () => {
    expect(paginationSchema.safeParse({ limit: 200 }).success).toBe(true);
  });

  it('rejects limit === 0', () => {
    const r = paginationSchema.safeParse({ limit: 0 });
    expect(r.success).toBe(false);
    if (r.success) return;
    expect(r.error.issues[0]?.path).toEqual(['limit']);
  });

  it('rejects limit > 200', () => {
    const r = paginationSchema.safeParse({ limit: 201 });
    expect(r.success).toBe(false);
    if (r.success) return;
    expect(r.error.issues[0]?.path).toEqual(['limit']);
  });

  it('rejects negative limit', () => {
    expect(paginationSchema.safeParse({ limit: -1 }).success).toBe(false);
  });

  it('rejects fractional limit', () => {
    const r = paginationSchema.safeParse({ limit: 50.5 });
    expect(r.success).toBe(false);
    if (r.success) return;
    expect(r.error.issues[0]?.path).toEqual(['limit']);
  });

  it('rejects non-number limit', () => {
    expect(paginationSchema.safeParse({ limit: 'abc' }).success).toBe(false);
  });

  it('accepts offset === 0', () => {
    expect(paginationSchema.safeParse({ offset: 0 }).success).toBe(true);
  });

  it('rejects offset < 0', () => {
    const r = paginationSchema.safeParse({ offset: -1 });
    expect(r.success).toBe(false);
    if (r.success) return;
    expect(r.error.issues[0]?.path).toEqual(['offset']);
  });

  it('rejects fractional offset', () => {
    expect(paginationSchema.safeParse({ offset: 1.5 }).success).toBe(false);
  });

  it('rejects non-number offset', () => {
    expect(paginationSchema.safeParse({ offset: 'abc' }).success).toBe(false);
  });

  it('rejects NaN limit', () => {
    expect(paginationSchema.safeParse({ limit: Number.NaN }).success).toBe(false);
  });

  it('rejects NaN offset', () => {
    expect(paginationSchema.safeParse({ offset: Number.NaN }).success).toBe(false);
  });

  it('produces a clean object with only provided fields', () => {
    const r = paginationSchema.safeParse({ limit: 25 });
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.data.limit).toBe(25);
    expect(r.data.offset).toBeUndefined();
  });
});
