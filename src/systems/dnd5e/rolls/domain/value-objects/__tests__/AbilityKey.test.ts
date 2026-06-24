import { ABILITY_KEYS, parseAbilityKey } from '../AbilityKey';
import { ValidationError } from '@/systems/shared/domain/errors';

describe('AbilityKey', () => {
  it('has 6 D&D 5e ability keys', () => {
    expect(ABILITY_KEYS).toHaveLength(6);
  });

  it('parses every valid ability key', () => {
    for (const ability of ABILITY_KEYS) {
      expect(parseAbilityKey(ability)).toBe(ability);
    }
  });

  it('throws ValidationError for an unknown ability key', () => {
    expect(() => parseAbilityKey('invalid')).toThrow(ValidationError);
    expect(() => parseAbilityKey('invalid')).toThrow(/Invalid ability key: invalid/);
  });
});
