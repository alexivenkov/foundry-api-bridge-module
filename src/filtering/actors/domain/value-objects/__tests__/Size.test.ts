import { ValidationError } from '@/kernel/domain/errors';
import { Size, parseSize } from '../Size';

describe('Size', () => {
  describe('enum values', () => {
    it('uses short codes per D&D 5e Foundry system', () => {
      expect(Size.Tiny).toBe('tiny');
      expect(Size.Small).toBe('sm');
      expect(Size.Medium).toBe('med');
      expect(Size.Large).toBe('lg');
      expect(Size.Huge).toBe('huge');
      expect(Size.Gargantuan).toBe('grg');
    });

    it('exposes exactly 6 values', () => {
      expect(Object.values(Size)).toHaveLength(6);
    });
  });

  describe('parseSize', () => {
    it('parses tiny', () => {
      expect(parseSize('tiny')).toBe(Size.Tiny);
    });

    it('parses TINY (uppercase)', () => {
      expect(parseSize('TINY')).toBe(Size.Tiny);
    });

    it('parses sm', () => {
      expect(parseSize('sm')).toBe(Size.Small);
    });

    it('parses SM (uppercase)', () => {
      expect(parseSize('SM')).toBe(Size.Small);
    });

    it('parses med', () => {
      expect(parseSize('med')).toBe(Size.Medium);
    });

    it('parses MeD (mixed case)', () => {
      expect(parseSize('MeD')).toBe(Size.Medium);
    });

    it('parses lg', () => {
      expect(parseSize('lg')).toBe(Size.Large);
    });

    it('parses huge', () => {
      expect(parseSize('huge')).toBe(Size.Huge);
    });

    it('parses Huge (mixed case)', () => {
      expect(parseSize('Huge')).toBe(Size.Huge);
    });

    it('parses grg', () => {
      expect(parseSize('grg')).toBe(Size.Gargantuan);
    });

    it('trims surrounding whitespace', () => {
      expect(parseSize('  lg  ')).toBe(Size.Large);
    });

    it('throws on full word "small" (we accept only short codes)', () => {
      expect(() => parseSize('small')).toThrow(ValidationError);
    });

    it('error message includes raw input for "small"', () => {
      expect(() => parseSize('small')).toThrow("unknown size: 'small'");
    });

    it('throws on full word "medium"', () => {
      expect(() => parseSize('medium')).toThrow(ValidationError);
    });

    it('throws on full word "large"', () => {
      expect(() => parseSize('large')).toThrow(ValidationError);
    });

    it('throws on full word "gargantuan"', () => {
      expect(() => parseSize('gargantuan')).toThrow(ValidationError);
    });

    it('throws on empty string', () => {
      expect(() => parseSize('')).toThrow(ValidationError);
    });

    it('throws on whitespace-only string', () => {
      expect(() => parseSize('   ')).toThrow(ValidationError);
    });

    it('throws on unknown code', () => {
      expect(() => parseSize('xl')).toThrow(ValidationError);
    });
  });
});
