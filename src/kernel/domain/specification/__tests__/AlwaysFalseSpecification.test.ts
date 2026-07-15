import { AlwaysFalseSpecification } from '../AlwaysFalseSpecification';
import { AlwaysTrueSpecification } from '../AlwaysTrueSpecification';

describe('AlwaysFalseSpecification', () => {
  it('returns false for any candidate', () => {
    const spec = new AlwaysFalseSpecification<number>();
    expect(spec.isSatisfiedBy(0)).toBe(false);
    expect(spec.isSatisfiedBy(42)).toBe(false);
    expect(spec.isSatisfiedBy(-1)).toBe(false);
  });

  it('returns false for unknown-typed candidates', () => {
    const spec = new AlwaysFalseSpecification<unknown>();
    expect(spec.isSatisfiedBy(null)).toBe(false);
    expect(spec.isSatisfiedBy(undefined)).toBe(false);
    expect(spec.isSatisfiedBy({})).toBe(false);
  });

  it('combined with AlwaysTrue via .and() yields false', () => {
    const composed = new AlwaysFalseSpecification<number>().and(new AlwaysTrueSpecification<number>());
    expect(composed.isSatisfiedBy(1)).toBe(false);
  });

  it('combined with AlwaysTrue via .or() yields true', () => {
    const composed = new AlwaysFalseSpecification<number>().or(new AlwaysTrueSpecification<number>());
    expect(composed.isSatisfiedBy(1)).toBe(true);
  });

  it('negation .not() yields true', () => {
    const negated = new AlwaysFalseSpecification<number>().not();
    expect(negated.isSatisfiedBy(1)).toBe(true);
  });
});
