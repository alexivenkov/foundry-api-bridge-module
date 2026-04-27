import { ValidationError } from '../../errors/ValidationError';
import { EnumSet } from '../EnumSet';

describe('EnumSet', () => {
  describe('construction', () => {
    it('throws on empty array', () => {
      expect(() => new EnumSet<string>([])).toThrow(ValidationError);
    });

    it('accepts single value', () => {
      const s = new EnumSet(['a']);
      expect(s.size()).toBe(1);
    });

    it('deduplicates values', () => {
      const s = new EnumSet(['a', 'b', 'a']);
      expect(s.size()).toBe(2);
    });

    it('deduplicates many duplicates', () => {
      const s = new EnumSet(['x', 'x', 'x', 'x']);
      expect(s.size()).toBe(1);
    });
  });

  describe('has()', () => {
    it('returns true for present value', () => {
      const s = new EnumSet(['a', 'b']);
      expect(s.has('a')).toBe(true);
    });

    it('returns false for absent value', () => {
      const s = new EnumSet<string>(['a', 'b']);
      expect(s.has('c')).toBe(false);
    });

    it('is case-sensitive', () => {
      const s = new EnumSet<string>(['Foo']);
      expect(s.has('foo')).toBe(false);
      expect(s.has('Foo')).toBe(true);
    });
  });

  describe('toArray()', () => {
    it('returns sorted array (lexicographic)', () => {
      const s = new EnumSet(['c', 'a', 'b']);
      expect(s.toArray()).toEqual(['a', 'b', 'c']);
    });

    it('returns deterministic order across constructions', () => {
      const a = new EnumSet(['c', 'a', 'b']).toArray();
      const b = new EnumSet(['b', 'c', 'a']).toArray();
      expect(a).toEqual(b);
    });

    it('returns deduplicated and sorted', () => {
      const s = new EnumSet(['b', 'a', 'b', 'c', 'a']);
      expect(s.toArray()).toEqual(['a', 'b', 'c']);
    });
  });

  describe('size()', () => {
    it('reflects unique count', () => {
      const s = new EnumSet(['a', 'b', 'c']);
      expect(s.size()).toBe(3);
    });
  });
});
