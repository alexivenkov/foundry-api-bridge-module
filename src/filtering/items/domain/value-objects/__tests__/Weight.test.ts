import { Weight } from '../Weight';

describe('Weight.normalize', () => {
  describe('plain number form (legacy dnd5e)', () => {
    it('extracts a finite positive number', () => {
      expect(Weight.normalize(2)).toBe(2);
    });

    it('extracts zero', () => {
      expect(Weight.normalize(0)).toBe(0);
    });

    it('extracts a fractional number', () => {
      expect(Weight.normalize(0.5)).toBe(0.5);
    });

    it('extracts a negative number (validation is caller-side)', () => {
      expect(Weight.normalize(-1)).toBe(-1);
    });

    it('returns null for NaN', () => {
      expect(Weight.normalize(Number.NaN)).toBeNull();
    });

    it('returns null for Infinity', () => {
      expect(Weight.normalize(Number.POSITIVE_INFINITY)).toBeNull();
    });
  });

  describe('object form (dnd5e v3+)', () => {
    it('extracts value from { value: 5 }', () => {
      expect(Weight.normalize({ value: 5 })).toBe(5);
    });

    it('extracts value from { value: 5, units: "lb" }', () => {
      expect(Weight.normalize({ value: 5, units: 'lb' })).toBe(5);
    });

    it('extracts a fractional value', () => {
      expect(Weight.normalize({ value: 0.25 })).toBe(0.25);
    });

    it('returns null when object value is non-numeric', () => {
      expect(Weight.normalize({ value: 'heavy' })).toBeNull();
    });

    it('returns null when object value is NaN', () => {
      expect(Weight.normalize({ value: Number.NaN })).toBeNull();
    });

    it('returns null when object value is Infinity', () => {
      expect(Weight.normalize({ value: Number.POSITIVE_INFINITY })).toBeNull();
    });

    it('returns null when object lacks value field', () => {
      expect(Weight.normalize({})).toBeNull();
    });
  });

  describe('falsy / missing inputs', () => {
    it('returns null for undefined', () => {
      expect(Weight.normalize(undefined)).toBeNull();
    });

    it('returns null for null', () => {
      expect(Weight.normalize(null)).toBeNull();
    });
  });

  describe('unsupported types', () => {
    it('returns null for string', () => {
      expect(Weight.normalize('5lb')).toBeNull();
    });

    it('returns null for boolean', () => {
      expect(Weight.normalize(true)).toBeNull();
    });
  });

  describe('frozen', () => {
    it('is frozen at runtime', () => {
      expect(Object.isFrozen(Weight)).toBe(true);
    });
  });
});
