import {
  CANTRIP_LIGHT,
  FIREBALL,
  LONGSWORD,
  POTION_OF_HEALING,
  RING_OF_PROTECTION,
  UNKNOWN_RING
} from '@/filtering/items/domain/__tests__/fixtures/itemSnapshots';
import { IdentifiedSpecification } from '../IdentifiedSpecification';

describe('IdentifiedSpecification', () => {
  describe('expected = true', () => {
    const spec = new IdentifiedSpecification(true);

    it('matches identified items', () => {
      expect(spec.isSatisfiedBy(LONGSWORD)).toBe(true);
      expect(spec.isSatisfiedBy(POTION_OF_HEALING)).toBe(true);
      expect(spec.isSatisfiedBy(RING_OF_PROTECTION)).toBe(true);
    });

    it('rejects UNKNOWN_RING (identified=false)', () => {
      expect(spec.isSatisfiedBy(UNKNOWN_RING)).toBe(false);
    });
  });

  describe('expected = false', () => {
    const spec = new IdentifiedSpecification(false);

    it('matches UNKNOWN_RING', () => {
      expect(spec.isSatisfiedBy(UNKNOWN_RING)).toBe(true);
    });

    it('rejects identified items', () => {
      expect(spec.isSatisfiedBy(LONGSWORD)).toBe(false);
    });
  });

  describe('silent-exclude on null', () => {
    it('silent-excludes spells (identified=null)', () => {
      const specTrue = new IdentifiedSpecification(true);
      const specFalse = new IdentifiedSpecification(false);
      expect(specTrue.isSatisfiedBy(FIREBALL)).toBe(false);
      expect(specFalse.isSatisfiedBy(FIREBALL)).toBe(false);
      expect(specTrue.isSatisfiedBy(CANTRIP_LIGHT)).toBe(false);
    });
  });
});
