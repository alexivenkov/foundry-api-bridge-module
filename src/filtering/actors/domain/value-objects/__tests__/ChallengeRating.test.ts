import { ChallengeRating } from '../ChallengeRating';

describe('ChallengeRating', () => {
  describe('VALID_VALUES', () => {
    it('contains exactly 34 entries (0, 1/8, 1/4, 1/2, plus 1..30)', () => {
      expect(ChallengeRating.VALID_VALUES).toHaveLength(34);
    });

    it('starts with 0 as the lowest CR', () => {
      expect(ChallengeRating.VALID_VALUES[0]).toBe(0);
    });

    it('contains the four fractional CRs (0, 1/8, 1/4, 1/2)', () => {
      expect(ChallengeRating.VALID_VALUES).toEqual(
        expect.arrayContaining([0, 0.125, 0.25, 0.5])
      );
    });

    it('contains every integer from 1 through 30', () => {
      for (let cr = 1; cr <= 30; cr += 1) {
        expect(ChallengeRating.VALID_VALUES).toContain(cr);
      }
    });

    it('does not contain 31', () => {
      expect(ChallengeRating.VALID_VALUES).not.toContain(31);
    });

    it('does not contain negative values', () => {
      expect(ChallengeRating.VALID_VALUES.every((v) => v >= 0)).toBe(true);
    });

    it('is sorted ascending', () => {
      const arr = ChallengeRating.VALID_VALUES;
      for (let i = 1; i < arr.length; i += 1) {
        const prev = arr[i - 1];
        const cur = arr[i];
        expect(prev).toBeDefined();
        expect(cur).toBeDefined();
        expect((prev as number) < (cur as number)).toBe(true);
      }
    });

    it('is treated as readonly array (mutation triggers TS / runtime guard)', () => {
      const proto = ChallengeRating.VALID_VALUES;
      // The contract is `readonly number[]` at the type level. We additionally
      // expect it to be frozen at runtime so accidental mutation throws.
      expect(Object.isFrozen(proto)).toBe(true);
    });
  });

  describe('isValid', () => {
    it('returns true for 0', () => {
      expect(ChallengeRating.isValid(0)).toBe(true);
    });

    it('returns true for 0.125 (1/8)', () => {
      expect(ChallengeRating.isValid(0.125)).toBe(true);
    });

    it('returns true for 0.25 (1/4)', () => {
      expect(ChallengeRating.isValid(0.25)).toBe(true);
    });

    it('returns true for 0.5 (1/2)', () => {
      expect(ChallengeRating.isValid(0.5)).toBe(true);
    });

    it('returns true for 1', () => {
      expect(ChallengeRating.isValid(1)).toBe(true);
    });

    it('returns true for 30 (top end)', () => {
      expect(ChallengeRating.isValid(30)).toBe(true);
    });

    it('returns false for 31 (above top end)', () => {
      expect(ChallengeRating.isValid(31)).toBe(false);
    });

    it('returns false for arbitrary fractional value 0.7', () => {
      expect(ChallengeRating.isValid(0.7)).toBe(false);
    });

    it('returns false for negative -1', () => {
      expect(ChallengeRating.isValid(-1)).toBe(false);
    });

    it('returns false for NaN', () => {
      expect(ChallengeRating.isValid(Number.NaN)).toBe(false);
    });

    it('returns false for Infinity', () => {
      expect(ChallengeRating.isValid(Number.POSITIVE_INFINITY)).toBe(false);
    });

    it('returns false for negative Infinity', () => {
      expect(ChallengeRating.isValid(Number.NEGATIVE_INFINITY)).toBe(false);
    });

    it('returns false for 1.5 (not on the integer grid above 1)', () => {
      expect(ChallengeRating.isValid(1.5)).toBe(false);
    });
  });
});
