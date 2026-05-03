import { SpellLevel } from '../SpellLevel';

describe('SpellLevel', () => {
  describe('static bounds', () => {
    it('MIN === 0 (cantrip)', () => {
      expect(SpellLevel.MIN).toBe(0);
    });

    it('MAX === 9', () => {
      expect(SpellLevel.MAX).toBe(9);
    });
  });

  describe('isValid', () => {
    it('returns true for 0 (cantrip)', () => {
      expect(SpellLevel.isValid(0)).toBe(true);
    });

    it('returns true for 1', () => {
      expect(SpellLevel.isValid(1)).toBe(true);
    });

    it('returns true for 9 (highest spell level)', () => {
      expect(SpellLevel.isValid(9)).toBe(true);
    });

    it('returns true for every integer in [0, 9]', () => {
      for (let i = 0; i <= 9; i += 1) {
        expect(SpellLevel.isValid(i)).toBe(true);
      }
    });

    it('returns false for 10 (above MAX)', () => {
      expect(SpellLevel.isValid(10)).toBe(false);
    });

    it('returns false for -1 (below MIN)', () => {
      expect(SpellLevel.isValid(-1)).toBe(false);
    });

    it('returns false for 0.5 (fractional)', () => {
      expect(SpellLevel.isValid(0.5)).toBe(false);
    });

    it('returns false for NaN', () => {
      expect(SpellLevel.isValid(Number.NaN)).toBe(false);
    });

    it('returns false for Infinity', () => {
      expect(SpellLevel.isValid(Number.POSITIVE_INFINITY)).toBe(false);
    });

    it('returns false for negative Infinity', () => {
      expect(SpellLevel.isValid(Number.NEGATIVE_INFINITY)).toBe(false);
    });
  });

  describe('frozen', () => {
    it('is frozen at runtime to prevent mutation', () => {
      expect(Object.isFrozen(SpellLevel)).toBe(true);
    });
  });
});
