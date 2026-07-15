import { ValidationError } from '../../errors/ValidationError';
import { PaginationParams } from '../PaginationParams';

describe('PaginationParams', () => {
  describe('construction', () => {
    it('accepts limit and offset within range', () => {
      const p = new PaginationParams(10, 0);
      expect(p.limit).toBe(10);
      expect(p.offset).toBe(0);
    });

    it('accepts MAX_LIMIT', () => {
      expect(() => new PaginationParams(PaginationParams.MAX_LIMIT, 0)).not.toThrow();
    });

    it('accepts MIN_LIMIT', () => {
      expect(() => new PaginationParams(PaginationParams.MIN_LIMIT, 0)).not.toThrow();
    });

    it('throws when limit is 0', () => {
      expect(() => new PaginationParams(0, 0)).toThrow(ValidationError);
    });

    it('throws when limit > MAX_LIMIT', () => {
      expect(() => new PaginationParams(PaginationParams.MAX_LIMIT + 1, 0)).toThrow(ValidationError);
    });

    it('throws when limit < MIN_LIMIT', () => {
      expect(() => new PaginationParams(-1, 0)).toThrow(ValidationError);
    });

    it('throws when limit is fractional', () => {
      expect(() => new PaginationParams(1.5, 0)).toThrow(ValidationError);
    });

    it('throws when limit is NaN', () => {
      expect(() => new PaginationParams(Number.NaN, 0)).toThrow(ValidationError);
    });

    it('throws when offset is negative', () => {
      expect(() => new PaginationParams(10, -1)).toThrow(ValidationError);
    });

    it('throws when offset is fractional', () => {
      expect(() => new PaginationParams(10, 1.5)).toThrow(ValidationError);
    });

    it('throws when offset is NaN', () => {
      expect(() => new PaginationParams(10, Number.NaN)).toThrow(ValidationError);
    });

    it('allows offset of 0', () => {
      expect(() => new PaginationParams(10, 0)).not.toThrow();
    });
  });

  describe('default()', () => {
    it('returns DEFAULT_LIMIT and DEFAULT_OFFSET', () => {
      const p = PaginationParams.default();
      expect(p.limit).toBe(PaginationParams.DEFAULT_LIMIT);
      expect(p.offset).toBe(PaginationParams.DEFAULT_OFFSET);
    });

    it('returns limit=50 and offset=0', () => {
      const p = PaginationParams.default();
      expect(p.limit).toBe(50);
      expect(p.offset).toBe(0);
    });
  });

  describe('apply()', () => {
    const items100 = Array.from({ length: 100 }, (_, i) => i);

    it('returns first page with hasMore=true', () => {
      const p = new PaginationParams(10, 0);
      const result = p.apply(items100);
      expect(result.page).toHaveLength(10);
      expect(result.total).toBe(100);
      expect(result.hasMore).toBe(true);
    });

    it('returns last partial page with hasMore=false', () => {
      const p = new PaginationParams(10, 95);
      const result = p.apply(items100);
      expect(result.page).toHaveLength(5);
      expect(result.total).toBe(100);
      expect(result.hasMore).toBe(false);
    });

    it('returns empty page when offset equals total', () => {
      const p = new PaginationParams(10, 100);
      const result = p.apply(items100);
      expect(result.page).toHaveLength(0);
      expect(result.total).toBe(100);
      expect(result.hasMore).toBe(false);
    });

    it('returns empty page when offset exceeds total', () => {
      const p = new PaginationParams(10, 200);
      const result = p.apply(items100);
      expect(result.page).toHaveLength(0);
      expect(result.total).toBe(100);
      expect(result.hasMore).toBe(false);
    });

    it('handles empty array', () => {
      const p = new PaginationParams(10, 0);
      const result = p.apply([]);
      expect(result.page).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.hasMore).toBe(false);
    });

    it('returns slice with the correct items', () => {
      const p = new PaginationParams(3, 5);
      const result = p.apply(items100);
      expect(result.page).toEqual([5, 6, 7]);
    });

    it('returns full array when limit >= total', () => {
      const p = new PaginationParams(200, 0);
      const result = p.apply(items100);
      expect(result.page).toHaveLength(100);
      expect(result.hasMore).toBe(false);
    });
  });
});
