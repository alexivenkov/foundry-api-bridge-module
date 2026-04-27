import { ABILITY_KEYS, AbilityKey } from '../AbilityScore';

describe('AbilityKey enum', () => {
  it('exposes the six D&D 5e ability shortcodes', () => {
    expect(AbilityKey.Str).toBe('str');
    expect(AbilityKey.Dex).toBe('dex');
    expect(AbilityKey.Con).toBe('con');
    expect(AbilityKey.Int).toBe('int');
    expect(AbilityKey.Wis).toBe('wis');
    expect(AbilityKey.Cha).toBe('cha');
  });
});

describe('ABILITY_KEYS', () => {
  it('contains exactly 6 entries', () => {
    expect(ABILITY_KEYS).toHaveLength(6);
  });

  it('lists keys in canonical D&D order: str, dex, con, int, wis, cha', () => {
    expect(ABILITY_KEYS).toEqual([
      AbilityKey.Str,
      AbilityKey.Dex,
      AbilityKey.Con,
      AbilityKey.Int,
      AbilityKey.Wis,
      AbilityKey.Cha
    ]);
  });

  it('only contains values that are members of AbilityKey', () => {
    const enumValues = new Set(Object.values(AbilityKey));
    for (const key of ABILITY_KEYS) {
      expect(enumValues.has(key)).toBe(true);
    }
  });
});
