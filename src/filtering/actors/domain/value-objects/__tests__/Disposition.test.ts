import { ValidationError } from '@/kernel/domain/errors';
import { Disposition, parseDisposition } from '../Disposition';

describe('Disposition', () => {
  describe('enum values', () => {
    it('exposes the four token disposition values', () => {
      expect(Disposition.Hostile).toBe('hostile');
      expect(Disposition.Neutral).toBe('neutral');
      expect(Disposition.Friendly).toBe('friendly');
      expect(Disposition.Secret).toBe('secret');
    });

    it('exposes exactly 4 values', () => {
      expect(Object.values(Disposition)).toHaveLength(4);
    });
  });

  describe('parseDisposition', () => {
    const cases: ReadonlyArray<readonly [string, Disposition]> = [
      ['hostile', Disposition.Hostile],
      ['neutral', Disposition.Neutral],
      ['friendly', Disposition.Friendly],
      ['secret', Disposition.Secret]
    ];

    it.each(cases)('parses lowercase %s', (raw, expected) => {
      expect(parseDisposition(raw)).toBe(expected);
    });

    it.each(cases)('parses uppercase %s', (raw, expected) => {
      expect(parseDisposition(raw.toUpperCase())).toBe(expected);
    });

    it('parses Friendly (mixed case)', () => {
      expect(parseDisposition('Friendly')).toBe(Disposition.Friendly);
    });

    it('trims surrounding whitespace', () => {
      expect(parseDisposition('  hostile  ')).toBe(Disposition.Hostile);
    });

    it('throws on unknown disposition "angry"', () => {
      expect(() => parseDisposition('angry')).toThrow(ValidationError);
    });

    it('error message includes raw input', () => {
      expect(() => parseDisposition('angry')).toThrow("unknown disposition: 'angry'");
    });

    it('throws on empty string', () => {
      expect(() => parseDisposition('')).toThrow(ValidationError);
    });

    it('throws on whitespace-only string', () => {
      expect(() => parseDisposition('   ')).toThrow(ValidationError);
    });
  });
});
