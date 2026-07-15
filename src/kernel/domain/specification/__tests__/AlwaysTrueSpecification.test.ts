import { AlwaysTrueSpecification } from '../AlwaysTrueSpecification';
import { AlwaysFalseSpecification } from '../AlwaysFalseSpecification';

describe('AlwaysTrueSpecification', () => {
  it('returns true for any candidate', () => {
    const spec = new AlwaysTrueSpecification<number>();
    expect(spec.isSatisfiedBy(0)).toBe(true);
    expect(spec.isSatisfiedBy(42)).toBe(true);
    expect(spec.isSatisfiedBy(-1)).toBe(true);
  });

  it('returns true for unknown-typed candidates', () => {
    const spec = new AlwaysTrueSpecification<unknown>();
    expect(spec.isSatisfiedBy(null)).toBe(true);
    expect(spec.isSatisfiedBy(undefined)).toBe(true);
    expect(spec.isSatisfiedBy('any string')).toBe(true);
    expect(spec.isSatisfiedBy({ foo: 'bar' })).toBe(true);
  });

  it('combined with AlwaysFalse via .and() yields false (neutral element of AND only when paired with true)', () => {
    const composed = new AlwaysTrueSpecification<number>().and(new AlwaysFalseSpecification<number>());
    expect(composed.isSatisfiedBy(1)).toBe(false);
  });

  it('combined with AlwaysFalse via .or() yields true', () => {
    const composed = new AlwaysTrueSpecification<number>().or(new AlwaysFalseSpecification<number>());
    expect(composed.isSatisfiedBy(1)).toBe(true);
  });

  it('negation .not() yields false', () => {
    const negated = new AlwaysTrueSpecification<number>().not();
    expect(negated.isSatisfiedBy(1)).toBe(false);
  });
});
