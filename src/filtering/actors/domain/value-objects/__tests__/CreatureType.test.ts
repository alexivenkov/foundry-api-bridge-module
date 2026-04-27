import { ValidationError } from '@/filtering/shared/domain/errors';
import { CreatureType, parseCreatureType } from '../CreatureType';

describe('CreatureType', () => {
  describe('enum values', () => {
    it('exposes all 14 SRD creature types', () => {
      const values = Object.values(CreatureType);
      expect(values).toHaveLength(14);
      expect(values).toEqual(
        expect.arrayContaining([
          'aberration',
          'beast',
          'celestial',
          'construct',
          'dragon',
          'elemental',
          'fey',
          'fiend',
          'giant',
          'humanoid',
          'monstrosity',
          'ooze',
          'plant',
          'undead'
        ])
      );
    });
  });

  describe('parseCreatureType', () => {
    const cases: ReadonlyArray<readonly [string, CreatureType]> = [
      ['aberration', CreatureType.Aberration],
      ['beast', CreatureType.Beast],
      ['celestial', CreatureType.Celestial],
      ['construct', CreatureType.Construct],
      ['dragon', CreatureType.Dragon],
      ['elemental', CreatureType.Elemental],
      ['fey', CreatureType.Fey],
      ['fiend', CreatureType.Fiend],
      ['giant', CreatureType.Giant],
      ['humanoid', CreatureType.Humanoid],
      ['monstrosity', CreatureType.Monstrosity],
      ['ooze', CreatureType.Ooze],
      ['plant', CreatureType.Plant],
      ['undead', CreatureType.Undead]
    ];

    it.each(cases)('parses lowercase %s', (raw, expected) => {
      expect(parseCreatureType(raw)).toBe(expected);
    });

    it.each(cases)('parses uppercase variant of %s', (raw, expected) => {
      expect(parseCreatureType(raw.toUpperCase())).toBe(expected);
    });

    it('parses mixed case Dragon', () => {
      expect(parseCreatureType('Dragon')).toBe(CreatureType.Dragon);
    });

    it('parses mixed case HuMaNoId', () => {
      expect(parseCreatureType('HuMaNoId')).toBe(CreatureType.Humanoid);
    });

    it('trims surrounding whitespace', () => {
      expect(parseCreatureType('  beast  ')).toBe(CreatureType.Beast);
    });

    it('throws ValidationError for non-SRD type "demon"', () => {
      expect(() => parseCreatureType('demon')).toThrow(ValidationError);
    });

    it('error message contains original raw input for "demon"', () => {
      expect(() => parseCreatureType('demon')).toThrow("unknown creatureType: 'demon'");
    });

    it('throws on empty string', () => {
      expect(() => parseCreatureType('')).toThrow(ValidationError);
    });

    it('throws on whitespace-only string', () => {
      expect(() => parseCreatureType('   ')).toThrow(ValidationError);
    });

    it('throws on partial match', () => {
      expect(() => parseCreatureType('drag')).toThrow(ValidationError);
    });
  });
});
