import { SubstringQuery } from '@/filtering/shared/domain/value-objects';
import {
  CASK,
  FIREBALL,
  LONGSWORD,
  POTION_OF_HEALING
} from '@/filtering/items/domain/__tests__/fixtures/itemSnapshots';
import { NameContainsSpecification } from '../NameContainsSpecification';

describe('NameContainsSpecification (items)', () => {
  it('matches "fire" in FIREBALL', () => {
    const spec = new NameContainsSpecification(new SubstringQuery('fire'));
    expect(spec.isSatisfiedBy(FIREBALL)).toBe(true);
  });

  it('matches "long" in LONGSWORD', () => {
    const spec = new NameContainsSpecification(new SubstringQuery('long'));
    expect(spec.isSatisfiedBy(LONGSWORD)).toBe(true);
  });

  it('does not match "ring" in CASK', () => {
    const spec = new NameContainsSpecification(new SubstringQuery('ring'));
    expect(spec.isSatisfiedBy(CASK)).toBe(false);
  });

  it('is case-insensitive (uppercase "POTION" matches POTION_OF_HEALING)', () => {
    const spec = new NameContainsSpecification(new SubstringQuery('POTION'));
    expect(spec.isSatisfiedBy(POTION_OF_HEALING)).toBe(true);
  });

  it('is case-insensitive (mixed case "PoTiOn")', () => {
    const spec = new NameContainsSpecification(new SubstringQuery('PoTiOn'));
    expect(spec.isSatisfiedBy(POTION_OF_HEALING)).toBe(true);
  });

  it('integrates with CompositeSpecification.and()', () => {
    const a = new NameContainsSpecification(new SubstringQuery('long'));
    const b = new NameContainsSpecification(new SubstringQuery('sword'));
    const composed = a.and(b);
    expect(composed.isSatisfiedBy(LONGSWORD)).toBe(true);
    expect(composed.isSatisfiedBy(CASK)).toBe(false);
  });

  it('integrates with CompositeSpecification.not()', () => {
    const spec = new NameContainsSpecification(new SubstringQuery('fire')).not();
    expect(spec.isSatisfiedBy(FIREBALL)).toBe(false);
    expect(spec.isSatisfiedBy(LONGSWORD)).toBe(true);
  });
});
