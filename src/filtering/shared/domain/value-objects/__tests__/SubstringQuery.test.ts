import { ValidationError } from '../../errors/ValidationError';
import { SubstringQuery } from '../SubstringQuery';

describe('SubstringQuery', () => {
  describe('construction', () => {
    it('throws on empty string', () => {
      expect(() => new SubstringQuery('')).toThrow(ValidationError);
    });

    it('throws on whitespace-only string', () => {
      expect(() => new SubstringQuery('   ')).toThrow(ValidationError);
    });

    it('throws on tab/newline-only string', () => {
      expect(() => new SubstringQuery('\t\n')).toThrow(ValidationError);
    });

    it('trims and lowercases the input', () => {
      const q = new SubstringQuery('  Goblin  ');
      expect(q.normalized).toBe('goblin');
    });

    it('preserves internal whitespace', () => {
      const q = new SubstringQuery('  blin warr  ');
      expect(q.normalized).toBe('blin warr');
    });
  });

  describe('matches', () => {
    it('matches case-insensitively', () => {
      expect(new SubstringQuery('gob').matches('Goblin Warrior')).toBe(true);
    });

    it('matches with internal whitespace', () => {
      expect(new SubstringQuery('blin warr').matches('Goblin Warrior')).toBe(true);
    });

    it('returns false when target does not contain the query', () => {
      expect(new SubstringQuery('orc').matches('Goblin Warrior')).toBe(false);
    });

    it('matches when target equals query (case-insensitive)', () => {
      expect(new SubstringQuery('Goblin').matches('goblin')).toBe(true);
    });

    it('returns false on empty target', () => {
      expect(new SubstringQuery('gob').matches('')).toBe(false);
    });

    it('returns false on whitespace-only target', () => {
      expect(new SubstringQuery('gob').matches('   ')).toBe(false);
    });

    it('handles target with surrounding whitespace', () => {
      expect(new SubstringQuery('gob').matches('  Goblin  ')).toBe(true);
    });
  });
});
