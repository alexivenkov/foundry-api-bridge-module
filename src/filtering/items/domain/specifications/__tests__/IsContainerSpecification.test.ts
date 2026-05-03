import {
  ALL_FIXTURES,
  CASK,
  FIREBALL,
  LONGSWORD
} from '@/filtering/items/domain/__tests__/fixtures/itemSnapshots';
import { IsContainerSpecification } from '../IsContainerSpecification';

describe('IsContainerSpecification', () => {
  describe('expected = true', () => {
    const spec = new IsContainerSpecification(true);

    it('matches CASK', () => {
      expect(spec.isSatisfiedBy(CASK)).toBe(true);
    });

    it('rejects non-containers', () => {
      expect(spec.isSatisfiedBy(LONGSWORD)).toBe(false);
      expect(spec.isSatisfiedBy(FIREBALL)).toBe(false);
    });
  });

  describe('expected = false', () => {
    const spec = new IsContainerSpecification(false);

    it('matches every non-container', () => {
      for (const item of ALL_FIXTURES) {
        if (item === CASK) continue;
        expect(spec.isSatisfiedBy(item)).toBe(true);
      }
    });

    it('rejects CASK', () => {
      expect(spec.isSatisfiedBy(CASK)).toBe(false);
    });
  });

  describe('no silent-exclude (field is universal)', () => {
    it('every fixture matches exactly one of true/false specs', () => {
      for (const item of ALL_FIXTURES) {
        const specTrue = new IsContainerSpecification(true);
        const specFalse = new IsContainerSpecification(false);
        expect(specTrue.isSatisfiedBy(item) !== specFalse.isSatisfiedBy(item)).toBe(true);
      }
    });
  });
});
