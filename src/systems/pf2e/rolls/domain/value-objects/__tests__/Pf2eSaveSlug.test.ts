import { parsePf2eSaveSlug, PF2E_SAVE_SLUGS } from '../Pf2eSaveSlug';
import { ValidationError } from '@/systems/shared/domain/errors';

describe('parsePf2eSaveSlug', () => {
  it('accepts fortitude, reflex and will', () => {
    for (const slug of PF2E_SAVE_SLUGS) {
      expect(parsePf2eSaveSlug(slug)).toBe(slug);
    }
  });

  it('rejects a dnd5e ability key', () => {
    expect(() => parsePf2eSaveSlug('dex')).toThrow(ValidationError);
  });

  it('rejects an unknown slug', () => {
    expect(() => parsePf2eSaveSlug('dodge')).toThrow(ValidationError);
  });
});
