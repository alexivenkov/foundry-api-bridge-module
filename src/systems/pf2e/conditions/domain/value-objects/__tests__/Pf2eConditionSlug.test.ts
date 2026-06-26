import {
  parsePf2eConditionSlug,
  PF2E_CONDITION_SLUGS,
  PF2E_VALUED_CONDITION_SLUGS
} from '../Pf2eConditionSlug';
import { ValidationError } from '@/systems/shared/domain/errors';

describe('parsePf2eConditionSlug', () => {
  it('accepts every supported condition slug', () => {
    for (const slug of PF2E_CONDITION_SLUGS) {
      expect(parsePf2eConditionSlug(slug)).toBe(slug);
    }
  });

  it('rejects persistent-damage (dialog) and malevolence (absent)', () => {
    expect(() => parsePf2eConditionSlug('persistent-damage')).toThrow(ValidationError);
    expect(() => parsePf2eConditionSlug('malevolence')).toThrow(ValidationError);
  });

  it('rejects an unknown slug', () => {
    expect(() => parsePf2eConditionSlug('charmed')).toThrow(ValidationError);
  });

  it('marks frightened as valued and prone as non-valued', () => {
    expect(PF2E_VALUED_CONDITION_SLUGS.has('frightened')).toBe(true);
    expect(PF2E_VALUED_CONDITION_SLUGS.has('prone')).toBe(false);
  });
});
