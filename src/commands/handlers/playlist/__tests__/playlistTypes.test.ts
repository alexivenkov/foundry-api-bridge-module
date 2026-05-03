import { modeFromNumber, modeToNumber } from '../playlistTypes';

describe('playlistTypes helpers', () => {
  describe('modeFromNumber', () => {
    it('should map -1 to soundboard', () => {
      expect(modeFromNumber(-1)).toBe('soundboard');
    });

    it('should map 0 to disabled', () => {
      expect(modeFromNumber(0)).toBe('disabled');
    });

    it('should map 1 to sequential', () => {
      expect(modeFromNumber(1)).toBe('sequential');
    });

    it('should map 2 to shuffle', () => {
      expect(modeFromNumber(2)).toBe('shuffle');
    });

    it('should map 3 to simultaneous', () => {
      expect(modeFromNumber(3)).toBe('simultaneous');
    });

    it('should default to disabled for unknown numbers', () => {
      expect(modeFromNumber(99)).toBe('disabled');
      expect(modeFromNumber(-99)).toBe('disabled');
    });
  });

  describe('modeToNumber', () => {
    it('should map soundboard to -1', () => {
      expect(modeToNumber('soundboard')).toBe(-1);
    });

    it('should map disabled to 0', () => {
      expect(modeToNumber('disabled')).toBe(0);
    });

    it('should map sequential to 1', () => {
      expect(modeToNumber('sequential')).toBe(1);
    });

    it('should map shuffle to 2', () => {
      expect(modeToNumber('shuffle')).toBe(2);
    });

    it('should map simultaneous to 3', () => {
      expect(modeToNumber('simultaneous')).toBe(3);
    });
  });
});
