import { ValidationError } from '@/kernel/domain/errors';
import { SpellSchool, parseSpellSchool } from '../SpellSchool';

describe('SpellSchool', () => {
  describe('enum values', () => {
    it('exposes all 8 D&D 5e spell schools (full words)', () => {
      expect(SpellSchool.Abjuration).toBe('abjuration');
      expect(SpellSchool.Conjuration).toBe('conjuration');
      expect(SpellSchool.Divination).toBe('divination');
      expect(SpellSchool.Enchantment).toBe('enchantment');
      expect(SpellSchool.Evocation).toBe('evocation');
      expect(SpellSchool.Illusion).toBe('illusion');
      expect(SpellSchool.Necromancy).toBe('necromancy');
      expect(SpellSchool.Transmutation).toBe('transmutation');
    });

    it('contains exactly 8 values', () => {
      expect(Object.values(SpellSchool)).toHaveLength(8);
    });
  });

  describe('parseSpellSchool', () => {
    it('parses lowercase evocation', () => {
      expect(parseSpellSchool('evocation')).toBe(SpellSchool.Evocation);
    });

    it('parses uppercase ABJURATION', () => {
      expect(parseSpellSchool('ABJURATION')).toBe(SpellSchool.Abjuration);
    });

    it('parses mixed-case Necromancy', () => {
      expect(parseSpellSchool('Necromancy')).toBe(SpellSchool.Necromancy);
    });

    it('trims surrounding whitespace before parsing', () => {
      expect(parseSpellSchool('  illusion  ')).toBe(SpellSchool.Illusion);
    });

    it('parses every documented school', () => {
      for (const v of Object.values(SpellSchool)) {
        expect(parseSpellSchool(v)).toBe(v);
      }
    });

    it('throws ValidationError for unknown value', () => {
      expect(() => parseSpellSchool('chaos')).toThrow(ValidationError);
    });

    it('does NOT accept 3-letter Foundry codes (caller is responsible)', () => {
      // Wire DTO uses full names; mapper translates Foundry codes separately.
      expect(() => parseSpellSchool('abj')).toThrow(ValidationError);
      expect(() => parseSpellSchool('evo')).toThrow(ValidationError);
    });

    it('error message includes original raw input', () => {
      expect(() => parseSpellSchool('chaos')).toThrow(
        "unknown spellSchool: 'chaos'"
      );
    });

    it('throws ValidationError for empty string', () => {
      expect(() => parseSpellSchool('')).toThrow(ValidationError);
    });
  });
});
