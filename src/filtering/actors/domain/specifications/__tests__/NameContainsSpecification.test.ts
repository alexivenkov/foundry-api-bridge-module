import { SubstringQuery } from '@/kernel/domain/value-objects';
import {
  ANCIENT_RED_DRAGON,
  FRODO,
  GANDALF,
  GOBLIN
} from '@/filtering/actors/domain/__tests__/fixtures/actorSnapshots';
import { NameContainsSpecification } from '../NameContainsSpecification';

describe('NameContainsSpecification', () => {
  it('matches substring "gob" in GOBLIN', () => {
    const spec = new NameContainsSpecification(new SubstringQuery('gob'));
    expect(spec.isSatisfiedBy(GOBLIN)).toBe(true);
  });

  it('matches substring "drag" in ANCIENT_RED_DRAGON', () => {
    const spec = new NameContainsSpecification(new SubstringQuery('drag'));
    expect(spec.isSatisfiedBy(ANCIENT_RED_DRAGON)).toBe(true);
  });

  it('does not match "frodo" in GOBLIN', () => {
    const spec = new NameContainsSpecification(new SubstringQuery('frodo'));
    expect(spec.isSatisfiedBy(GOBLIN)).toBe(false);
  });

  it('is case-insensitive (uppercase query "GANDALF" matches GANDALF)', () => {
    const spec = new NameContainsSpecification(new SubstringQuery('GANDALF'));
    expect(spec.isSatisfiedBy(GANDALF)).toBe(true);
  });

  it('is case-insensitive (mixed case "GaNdAlF" matches GANDALF)', () => {
    const spec = new NameContainsSpecification(new SubstringQuery('GaNdAlF'));
    expect(spec.isSatisfiedBy(GANDALF)).toBe(true);
  });

  it('does not match a foreign substring against FRODO', () => {
    const spec = new NameContainsSpecification(new SubstringQuery('dragon'));
    expect(spec.isSatisfiedBy(FRODO)).toBe(false);
  });

  it('integrates with CompositeSpecification.and() — both must hold', () => {
    const hasFro = new NameContainsSpecification(new SubstringQuery('fro'));
    const hasBag = new NameContainsSpecification(new SubstringQuery('bag'));
    const composed = hasFro.and(hasBag);

    expect(composed.isSatisfiedBy(FRODO)).toBe(true);
    expect(composed.isSatisfiedBy(GANDALF)).toBe(false);
  });

  it('integrates with CompositeSpecification.not() — negates correctly', () => {
    const spec = new NameContainsSpecification(new SubstringQuery('gob')).not();
    expect(spec.isSatisfiedBy(GOBLIN)).toBe(false);
    expect(spec.isSatisfiedBy(GANDALF)).toBe(true);
  });
});
