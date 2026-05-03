import { ValidationError } from '@/filtering/shared/domain/errors';
import { ItemType, parseItemType } from '../ItemType';

describe('ItemType', () => {
  describe('enum values', () => {
    it('exposes all 13 item types', () => {
      expect(ItemType.Weapon).toBe('weapon');
      expect(ItemType.Equipment).toBe('equipment');
      expect(ItemType.Consumable).toBe('consumable');
      expect(ItemType.Tool).toBe('tool');
      expect(ItemType.Container).toBe('container');
      expect(ItemType.Loot).toBe('loot');
      expect(ItemType.Spell).toBe('spell');
      expect(ItemType.Feat).toBe('feat');
      expect(ItemType.Background).toBe('background');
      expect(ItemType.Race).toBe('race');
      expect(ItemType.Class).toBe('class');
      expect(ItemType.Subclass).toBe('subclass');
      expect(ItemType.Feature).toBe('feature');
    });

    it('contains exactly 13 values', () => {
      expect(Object.values(ItemType)).toHaveLength(13);
    });
  });

  describe('parseItemType', () => {
    it('parses lowercase weapon', () => {
      expect(parseItemType('weapon')).toBe(ItemType.Weapon);
    });

    it('parses uppercase WEAPON', () => {
      expect(parseItemType('WEAPON')).toBe(ItemType.Weapon);
    });

    it('parses mixed-case Weapon', () => {
      expect(parseItemType('Weapon')).toBe(ItemType.Weapon);
    });

    it('parses spell', () => {
      expect(parseItemType('spell')).toBe(ItemType.Spell);
    });

    it('parses container', () => {
      expect(parseItemType('container')).toBe(ItemType.Container);
    });

    it('parses every documented item type', () => {
      const all = Object.values(ItemType);
      for (const v of all) {
        expect(parseItemType(v)).toBe(v);
      }
    });

    it('trims surrounding whitespace before parsing', () => {
      expect(parseItemType('  consumable  ')).toBe(ItemType.Consumable);
    });

    it('throws ValidationError for unknown value', () => {
      expect(() => parseItemType('unknown-type')).toThrow(ValidationError);
    });

    it('error message includes original raw input', () => {
      expect(() => parseItemType('xyz')).toThrow("unknown itemType: 'xyz'");
    });

    it('throws ValidationError for empty string', () => {
      expect(() => parseItemType('')).toThrow(ValidationError);
    });

    it('throws ValidationError for whitespace-only string', () => {
      expect(() => parseItemType('   ')).toThrow(ValidationError);
    });
  });
});
