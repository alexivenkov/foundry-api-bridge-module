import { parsePf2eSkillSlug, PF2E_SKILL_SLUGS } from '../Pf2eSkillSlug';
import { ValidationError } from '@/systems/shared/domain/errors';

describe('parsePf2eSkillSlug', () => {
  it('accepts every core skill slug', () => {
    for (const slug of PF2E_SKILL_SLUGS) {
      expect(parsePf2eSkillSlug(slug)).toBe(slug);
    }
  });

  it('rejects a dnd5e abbreviation', () => {
    expect(() => parsePf2eSkillSlug('acr')).toThrow(ValidationError);
  });

  it('rejects an unknown slug', () => {
    expect(() => parsePf2eSkillSlug('flying')).toThrow(ValidationError);
  });
});
