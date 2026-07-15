import { Range } from '@/kernel/domain/value-objects';
import {
  CANTRIP_LIGHT,
  CASK,
  FIREBALL,
  LONGSWORD,
  POTION_OF_HEALING,
  RING_OF_PROTECTION
} from '@/filtering/items/domain/__tests__/fixtures/itemSnapshots';
import { WeightRangeSpecification } from '../WeightRangeSpecification';

describe('WeightRangeSpecification', () => {
  it('matches items with weight in [0, 1]', () => {
    const spec = new WeightRangeSpecification(new Range(0, 1));
    expect(spec.isSatisfiedBy(POTION_OF_HEALING)).toBe(true);
    expect(spec.isSatisfiedBy(RING_OF_PROTECTION)).toBe(true);
    expect(spec.isSatisfiedBy(LONGSWORD)).toBe(false);
  });

  it('Range(50, undefined) matches CASK only', () => {
    const spec = new WeightRangeSpecification(new Range(50, undefined));
    expect(spec.isSatisfiedBy(CASK)).toBe(true);
    expect(spec.isSatisfiedBy(LONGSWORD)).toBe(false);
  });

  it('Range(undefined, 0) matches RING_OF_PROTECTION (weight=0)', () => {
    const spec = new WeightRangeSpecification(new Range(undefined, 0));
    expect(spec.isSatisfiedBy(RING_OF_PROTECTION)).toBe(true);
    expect(spec.isSatisfiedBy(LONGSWORD)).toBe(false);
  });

  it('boundary inclusion — exact match', () => {
    const spec = new WeightRangeSpecification(new Range(3, 3));
    expect(spec.isSatisfiedBy(LONGSWORD)).toBe(true);
  });

  it('silent-excludes spells (weight=null)', () => {
    const spec = new WeightRangeSpecification(new Range(0, 1000));
    expect(spec.isSatisfiedBy(FIREBALL)).toBe(false);
    expect(spec.isSatisfiedBy(CANTRIP_LIGHT)).toBe(false);
  });
});
