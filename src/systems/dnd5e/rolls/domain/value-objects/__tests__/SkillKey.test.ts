import { SKILL_KEYS, parseSkillKey } from '../SkillKey';
import { ValidationError } from '@/systems/shared/domain/errors';

describe('SkillKey', () => {
  it('has 18 D&D 5e skill keys', () => {
    expect(SKILL_KEYS).toHaveLength(18);
  });

  it('parses every valid skill key', () => {
    for (const skill of SKILL_KEYS) {
      expect(parseSkillKey(skill)).toBe(skill);
    }
  });

  it('throws ValidationError for an unknown skill key', () => {
    expect(() => parseSkillKey('invalid')).toThrow(ValidationError);
    expect(() => parseSkillKey('invalid')).toThrow(/Invalid skill key: invalid/);
  });
});
