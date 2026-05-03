import { Price } from '../Price';

describe('Price.normalizeToGp', () => {
  describe('plain number form', () => {
    it('treats a plain number as gp by convention', () => {
      expect(Price.normalizeToGp(50)).toBe(50);
    });

    it('returns 0 for 0', () => {
      expect(Price.normalizeToGp(0)).toBe(0);
    });

    it('returns null for NaN', () => {
      expect(Price.normalizeToGp(Number.NaN)).toBeNull();
    });

    it('returns null for Infinity', () => {
      expect(Price.normalizeToGp(Number.POSITIVE_INFINITY)).toBeNull();
    });
  });

  describe('object form — denomination conversion', () => {
    it('converts 10gp to 10gp', () => {
      expect(Price.normalizeToGp({ value: 10, denomination: 'gp' })).toBe(10);
    });

    it('converts 1pp to 10gp', () => {
      expect(Price.normalizeToGp({ value: 1, denomination: 'pp' })).toBe(10);
    });

    it('converts 5pp to 50gp', () => {
      expect(Price.normalizeToGp({ value: 5, denomination: 'pp' })).toBe(50);
    });

    it('converts 1ep to 0.5gp', () => {
      expect(Price.normalizeToGp({ value: 1, denomination: 'ep' })).toBe(0.5);
    });

    it('converts 10sp to 1gp', () => {
      expect(Price.normalizeToGp({ value: 10, denomination: 'sp' })).toBe(1);
    });

    it('converts 100cp to 1gp', () => {
      // 100 * 0.01 → 1 (subject to FP rounding; check tolerance)
      const result = Price.normalizeToGp({ value: 100, denomination: 'cp' });
      expect(result).toBeCloseTo(1, 10);
    });

    it('treats absent denomination as gp by default', () => {
      expect(Price.normalizeToGp({ value: 25 })).toBe(25);
    });

    it('is case-insensitive for denomination', () => {
      expect(Price.normalizeToGp({ value: 1, denomination: 'PP' })).toBe(10);
      expect(Price.normalizeToGp({ value: 1, denomination: 'Gp' })).toBe(1);
    });

    it('trims whitespace from denomination', () => {
      expect(Price.normalizeToGp({ value: 1, denomination: '  gp  ' })).toBe(1);
    });

    it('returns null for unknown denomination', () => {
      expect(Price.normalizeToGp({ value: 5, denomination: 'xx' })).toBeNull();
    });

    it('returns null when value is non-numeric', () => {
      expect(Price.normalizeToGp({ value: 'free', denomination: 'gp' })).toBeNull();
    });

    it('returns null when value is NaN', () => {
      expect(Price.normalizeToGp({ value: Number.NaN, denomination: 'gp' })).toBeNull();
    });

    it('returns null when value is Infinity', () => {
      expect(
        Price.normalizeToGp({ value: Number.POSITIVE_INFINITY, denomination: 'gp' })
      ).toBeNull();
    });

    it('returns null when value field is missing entirely', () => {
      expect(Price.normalizeToGp({ denomination: 'gp' })).toBeNull();
    });
  });

  describe('falsy / missing inputs', () => {
    it('returns null for undefined', () => {
      expect(Price.normalizeToGp(undefined)).toBeNull();
    });

    it('returns null for null', () => {
      expect(Price.normalizeToGp(null)).toBeNull();
    });
  });

  describe('unsupported types', () => {
    it('returns null for string', () => {
      expect(Price.normalizeToGp('50gp')).toBeNull();
    });

    it('returns null for boolean', () => {
      expect(Price.normalizeToGp(false)).toBeNull();
    });
  });

  describe('frozen', () => {
    it('is frozen at runtime', () => {
      expect(Object.isFrozen(Price)).toBe(true);
    });
  });
});
