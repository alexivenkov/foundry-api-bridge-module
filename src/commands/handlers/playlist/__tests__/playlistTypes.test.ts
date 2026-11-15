import { modeFromNumber, modeToNumber } from '../playlistTypes';

describe('playlistTypes helpers', () => {
  describe('modeFromNumber', () => {
    it('should map -1 to soundboard', () => {
      expect(modeFromNumber(-1)).toBe('soundboard');
    });

    it('should map 0 to sequential', () => {
      expect(modeFromNumber(0)).toBe('sequential');
    });

    it('should map 1 to shuffle', () => {
      expect(modeFromNumber(1)).toBe('shuffle');
    });

    it('should map 2 to simultaneous', () => {
      expect(modeFromNumber(2)).toBe('simultaneous');
    });

    it('should treat 3, which the core does not have, as unknown', () => {
      expect(modeFromNumber(3)).toBe('soundboard');
    });

    it('should default to soundboard for unknown numbers', () => {
      expect(modeFromNumber(99)).toBe('soundboard');
      expect(modeFromNumber(-99)).toBe('soundboard');
    });
  });

  describe('modeToNumber', () => {
    it('should map soundboard to -1', () => {
      expect(modeToNumber('soundboard')).toBe(-1);
    });

    it('should map disabled to -1', () => {
      expect(modeToNumber('disabled')).toBe(-1);
    });

    it('should map sequential to 0', () => {
      expect(modeToNumber('sequential')).toBe(0);
    });

    it('should map shuffle to 1', () => {
      expect(modeToNumber('shuffle')).toBe(1);
    });

    it('should map simultaneous to 2', () => {
      expect(modeToNumber('simultaneous')).toBe(2);
    });
  });
});
