import {
  ARTIFACT_OF_DEAD,
  CANTRIP_LIGHT,
  FIREBALL,
  LONGSWORD,
  POTION_OF_HEALING,
  RING_OF_PROTECTION,
  UNKNOWN_RING
} from '@/filtering/items/domain/__tests__/fixtures/itemSnapshots';
import { RequiresAttunementSpecification } from '../RequiresAttunementSpecification';

describe('RequiresAttunementSpecification', () => {
  describe('expected = true', () => {
    const spec = new RequiresAttunementSpecification(true);

    it('matches RING_OF_PROTECTION', () => {
      expect(spec.isSatisfiedBy(RING_OF_PROTECTION)).toBe(true);
    });

    it('matches ARTIFACT_OF_DEAD', () => {
      expect(spec.isSatisfiedBy(ARTIFACT_OF_DEAD)).toBe(true);
    });

    it('matches UNKNOWN_RING', () => {
      expect(spec.isSatisfiedBy(UNKNOWN_RING)).toBe(true);
    });

    it('rejects LONGSWORD (requiresAttunement=false)', () => {
      expect(spec.isSatisfiedBy(LONGSWORD)).toBe(false);
    });

    it('rejects POTION_OF_HEALING (requiresAttunement=false)', () => {
      expect(spec.isSatisfiedBy(POTION_OF_HEALING)).toBe(false);
    });
  });

  describe('expected = false', () => {
    const spec = new RequiresAttunementSpecification(false);

    it('matches LONGSWORD (no attunement needed)', () => {
      expect(spec.isSatisfiedBy(LONGSWORD)).toBe(true);
    });

    it('rejects RING_OF_PROTECTION', () => {
      expect(spec.isSatisfiedBy(RING_OF_PROTECTION)).toBe(false);
    });
  });

  describe('silent-exclude on null', () => {
    it('silent-excludes FIREBALL (requiresAttunement=null)', () => {
      const specTrue = new RequiresAttunementSpecification(true);
      const specFalse = new RequiresAttunementSpecification(false);
      expect(specTrue.isSatisfiedBy(FIREBALL)).toBe(false);
      expect(specFalse.isSatisfiedBy(FIREBALL)).toBe(false);
    });

    it('silent-excludes CANTRIP_LIGHT (requiresAttunement=null)', () => {
      const spec = new RequiresAttunementSpecification(true);
      expect(spec.isSatisfiedBy(CANTRIP_LIGHT)).toBe(false);
    });
  });
});
