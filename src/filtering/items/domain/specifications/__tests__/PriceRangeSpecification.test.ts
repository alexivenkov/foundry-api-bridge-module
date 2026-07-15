import { Range } from '@/kernel/domain/value-objects';
import {
  ARTIFACT_OF_DEAD,
  CANTRIP_LIGHT,
  CASK,
  FIREBALL,
  LONGSWORD,
  POTION_OF_HEALING,
  RING_OF_PROTECTION,
  UNKNOWN_RING
} from '@/filtering/items/domain/__tests__/fixtures/itemSnapshots';
import { PriceRangeSpecification } from '../PriceRangeSpecification';

describe('PriceRangeSpecification', () => {
  it('Range(0, 100) matches LONGSWORD (15gp), POTION (50gp), CASK (5gp)', () => {
    const spec = new PriceRangeSpecification(new Range(0, 100));
    expect(spec.isSatisfiedBy(LONGSWORD)).toBe(true);
    expect(spec.isSatisfiedBy(POTION_OF_HEALING)).toBe(true);
    expect(spec.isSatisfiedBy(CASK)).toBe(true);
  });

  it('Range(1000, undefined) matches RING_OF_PROTECTION (1000gp) and ARTIFACT_OF_DEAD', () => {
    const spec = new PriceRangeSpecification(new Range(1000, undefined));
    expect(spec.isSatisfiedBy(RING_OF_PROTECTION)).toBe(true);
    expect(spec.isSatisfiedBy(ARTIFACT_OF_DEAD)).toBe(true);
    expect(spec.isSatisfiedBy(LONGSWORD)).toBe(false);
  });

  it('Range(0, 50000) matches ARTIFACT_OF_DEAD (50000gp boundary)', () => {
    const spec = new PriceRangeSpecification(new Range(0, 50000));
    expect(spec.isSatisfiedBy(ARTIFACT_OF_DEAD)).toBe(true);
  });

  it('silent-excludes spells (priceGp=null)', () => {
    const spec = new PriceRangeSpecification(new Range(0, 100000));
    expect(spec.isSatisfiedBy(FIREBALL)).toBe(false);
    expect(spec.isSatisfiedBy(CANTRIP_LIGHT)).toBe(false);
  });

  it('silent-excludes UNKNOWN_RING (priceGp=null)', () => {
    const spec = new PriceRangeSpecification(new Range(0, 100000));
    expect(spec.isSatisfiedBy(UNKNOWN_RING)).toBe(false);
  });
});
