import { ValidationError } from '../../errors/ValidationError';
import { Range } from '../Range';

describe('Range', () => {
  describe('construction', () => {
    it('throws when both bounds are undefined', () => {
      expect(() => new Range(undefined, undefined)).toThrow(ValidationError);
    });

    it('throws when min is greater than max', () => {
      expect(() => new Range(20, 10)).toThrow(ValidationError);
    });

    it('allows min equal to max', () => {
      expect(() => new Range(10, 10)).not.toThrow();
    });

    it('throws when min is NaN', () => {
      expect(() => new Range(Number.NaN, 10)).toThrow(ValidationError);
    });

    it('throws when max is NaN', () => {
      expect(() => new Range(0, Number.NaN)).toThrow(ValidationError);
    });

    it('throws when min is positive Infinity', () => {
      expect(() => new Range(Number.POSITIVE_INFINITY, 10)).toThrow(ValidationError);
    });

    it('throws when max is negative Infinity', () => {
      expect(() => new Range(0, Number.NEGATIVE_INFINITY)).toThrow(ValidationError);
    });

    it('allows only min defined', () => {
      const r = new Range(10, undefined);
      expect(r.min).toBe(10);
      expect(r.max).toBeUndefined();
    });

    it('allows only max defined', () => {
      const r = new Range(undefined, 20);
      expect(r.min).toBeUndefined();
      expect(r.max).toBe(20);
    });

    it('allows negative numbers', () => {
      const r = new Range(-5, 5);
      expect(r.min).toBe(-5);
      expect(r.max).toBe(5);
    });
  });

  describe('contains', () => {
    it('is inclusive at lower bound', () => {
      expect(new Range(10, 20).contains(10)).toBe(true);
    });

    it('is inclusive at upper bound', () => {
      expect(new Range(10, 20).contains(20)).toBe(true);
    });

    it('returns true for value within range', () => {
      expect(new Range(10, 20).contains(15)).toBe(true);
    });

    it('returns false for value below min', () => {
      expect(new Range(10, 20).contains(9)).toBe(false);
    });

    it('returns false for value above max', () => {
      expect(new Range(10, 20).contains(21)).toBe(false);
    });

    it('with only min: returns true above min', () => {
      expect(new Range(10, undefined).contains(100)).toBe(true);
    });

    it('with only min: returns false below min', () => {
      expect(new Range(10, undefined).contains(5)).toBe(false);
    });

    it('with only min: inclusive at min', () => {
      expect(new Range(10, undefined).contains(10)).toBe(true);
    });

    it('with only max: returns true below max', () => {
      expect(new Range(undefined, 20).contains(10)).toBe(true);
    });

    it('with only max: inclusive at max', () => {
      expect(new Range(undefined, 20).contains(20)).toBe(true);
    });

    it('with only max: returns false above max', () => {
      expect(new Range(undefined, 20).contains(21)).toBe(false);
    });
  });

  describe('toString', () => {
    it('formats both bounds', () => {
      expect(new Range(10, 20).toString()).toBe('[10..20]');
    });

    it('formats only min', () => {
      expect(new Range(10, undefined).toString()).toBe('[10..]');
    });

    it('formats only max', () => {
      expect(new Range(undefined, 20).toString()).toBe('[..20]');
    });
  });
});
