import { CompositeSpecification } from '../CompositeSpecification';
import { NotSpecification } from '../NotSpecification';

class FixedSpec extends CompositeSpecification<unknown> {
  constructor(private readonly result: boolean) {
    super();
  }

  override isSatisfiedBy(_candidate: unknown): boolean {
    return this.result;
  }
}

describe('NotSpecification', () => {
  it('inverts true to false', () => {
    const spec = new NotSpecification<unknown>(new FixedSpec(true));
    expect(spec.isSatisfiedBy(null)).toBe(false);
  });

  it('inverts false to true', () => {
    const spec = new NotSpecification<unknown>(new FixedSpec(false));
    expect(spec.isSatisfiedBy(null)).toBe(true);
  });

  it('double-negation returns the original boolean', () => {
    const inner = new FixedSpec(true);
    const doubleNot = new NotSpecification<unknown>(new NotSpecification<unknown>(inner));
    expect(doubleNot.isSatisfiedBy(null)).toBe(true);
  });

  it('supports chaining .and() through CompositeSpecification', () => {
    const negated = new NotSpecification<unknown>(new FixedSpec(false));
    const chained = negated.and(new FixedSpec(true));
    expect(chained.isSatisfiedBy(null)).toBe(true);
  });

  it('supports chaining .or()', () => {
    const negated = new NotSpecification<unknown>(new FixedSpec(true));
    const chained = negated.or(new FixedSpec(true));
    expect(chained.isSatisfiedBy(null)).toBe(true);
  });

  it('supports .not() on NotSpecification (yields original)', () => {
    const inner = new FixedSpec(true);
    const negated = new NotSpecification<unknown>(inner);
    expect(negated.not().isSatisfiedBy(null)).toBe(true);
  });
});
