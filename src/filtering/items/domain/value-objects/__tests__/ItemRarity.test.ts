import { ValidationError } from '@/kernel/domain/errors';
import { ItemRarity, parseItemRarity } from '../ItemRarity';

describe('ItemRarity', () => {
  describe('enum values', () => {
    it('exposes all 6 rarity tiers', () => {
      expect(ItemRarity.Common).toBe('common');
      expect(ItemRarity.Uncommon).toBe('uncommon');
      expect(ItemRarity.Rare).toBe('rare');
      expect(ItemRarity.VeryRare).toBe('veryRare');
      expect(ItemRarity.Legendary).toBe('legendary');
      expect(ItemRarity.Artifact).toBe('artifact');
    });

    it('contains exactly 6 values', () => {
      expect(Object.values(ItemRarity)).toHaveLength(6);
    });
  });

  describe('parseItemRarity — basic', () => {
    it('parses lowercase common', () => {
      expect(parseItemRarity('common')).toBe(ItemRarity.Common);
    });

    it('parses uppercase RARE', () => {
      expect(parseItemRarity('RARE')).toBe(ItemRarity.Rare);
    });

    it('parses mixed-case Legendary', () => {
      expect(parseItemRarity('Legendary')).toBe(ItemRarity.Legendary);
    });

    it('trims surrounding whitespace before parsing', () => {
      expect(parseItemRarity('  artifact  ')).toBe(ItemRarity.Artifact);
    });
  });

  describe('parseItemRarity — "very rare" alias handling (FOUNDRY edge case)', () => {
    it('parses canonical camelCase "veryRare"', () => {
      expect(parseItemRarity('veryRare')).toBe(ItemRarity.VeryRare);
    });

    it('parses lowercase "veryrare" (no separator)', () => {
      expect(parseItemRarity('veryrare')).toBe(ItemRarity.VeryRare);
    });

    it('parses spaced "very rare" (older dnd5e)', () => {
      expect(parseItemRarity('very rare')).toBe(ItemRarity.VeryRare);
    });

    it('parses "Very Rare" (mixed case + space)', () => {
      expect(parseItemRarity('Very Rare')).toBe(ItemRarity.VeryRare);
    });

    it('parses "VERY RARE" (uppercase + space)', () => {
      expect(parseItemRarity('VERY RARE')).toBe(ItemRarity.VeryRare);
    });

    it('trims spaces around the alias variants', () => {
      expect(parseItemRarity('  very rare  ')).toBe(ItemRarity.VeryRare);
    });
  });

  describe('parseItemRarity — errors', () => {
    it('throws ValidationError for unknown value', () => {
      expect(() => parseItemRarity('mythic')).toThrow(ValidationError);
    });

    it('error message includes original raw input', () => {
      expect(() => parseItemRarity('mythic')).toThrow("unknown itemRarity: 'mythic'");
    });

    it('throws ValidationError for empty string', () => {
      expect(() => parseItemRarity('')).toThrow(ValidationError);
    });

    it('throws ValidationError for whitespace-only string', () => {
      expect(() => parseItemRarity('   ')).toThrow(ValidationError);
    });
  });
});
