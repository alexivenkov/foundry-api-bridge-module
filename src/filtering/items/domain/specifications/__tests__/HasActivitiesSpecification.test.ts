import {
  ARTIFACT_OF_DEAD,
  CANTRIP_LIGHT,
  CASK,
  FIREBALL,
  LONGSWORD,
  POTION_OF_HEALING,
  RING_OF_PROTECTION
} from '@/filtering/items/domain/__tests__/fixtures/itemSnapshots';
import { HasActivitiesSpecification } from '../HasActivitiesSpecification';

describe('HasActivitiesSpecification', () => {
  describe('expected = true', () => {
    const spec = new HasActivitiesSpecification(true);

    it('matches LONGSWORD (hasActivities=true)', () => {
      expect(spec.isSatisfiedBy(LONGSWORD)).toBe(true);
    });

    it('matches POTION_OF_HEALING', () => {
      expect(spec.isSatisfiedBy(POTION_OF_HEALING)).toBe(true);
    });

    it('matches FIREBALL (spell with activities)', () => {
      expect(spec.isSatisfiedBy(FIREBALL)).toBe(true);
    });

    it('matches ARTIFACT_OF_DEAD', () => {
      expect(spec.isSatisfiedBy(ARTIFACT_OF_DEAD)).toBe(true);
    });

    it('rejects RING_OF_PROTECTION (hasActivities=false)', () => {
      expect(spec.isSatisfiedBy(RING_OF_PROTECTION)).toBe(false);
    });

    it('rejects CASK', () => {
      expect(spec.isSatisfiedBy(CASK)).toBe(false);
    });
  });

  describe('expected = false', () => {
    const spec = new HasActivitiesSpecification(false);

    it('matches CASK and RING_OF_PROTECTION', () => {
      expect(spec.isSatisfiedBy(CASK)).toBe(true);
      expect(spec.isSatisfiedBy(RING_OF_PROTECTION)).toBe(true);
    });

    it('matches CANTRIP_LIGHT (hasActivities=false)', () => {
      expect(spec.isSatisfiedBy(CANTRIP_LIGHT)).toBe(true);
    });

    it('rejects items with activities', () => {
      expect(spec.isSatisfiedBy(LONGSWORD)).toBe(false);
    });
  });

  describe('no silent-exclude (field is universal)', () => {
    it('every fixture returns either true or false based on its hasActivities flag', () => {
      const fixtures = [
        LONGSWORD,
        POTION_OF_HEALING,
        RING_OF_PROTECTION,
        ARTIFACT_OF_DEAD,
        FIREBALL,
        CANTRIP_LIGHT,
        CASK
      ];
      for (const item of fixtures) {
        const specTrue = new HasActivitiesSpecification(true);
        const specFalse = new HasActivitiesSpecification(false);
        expect(specTrue.isSatisfiedBy(item) || specFalse.isSatisfiedBy(item)).toBe(true);
      }
    });
  });
});
