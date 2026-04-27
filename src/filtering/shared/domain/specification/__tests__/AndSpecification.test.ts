import { AndSpecification } from '../AndSpecification';
import { CompositeSpecification } from '../CompositeSpecification';
import type { ISpecification } from '../Specification';

class FixedSpec extends CompositeSpecification<unknown> {
  public calls = 0;

  constructor(private readonly result: boolean) {
    super();
  }

  override isSatisfiedBy(_candidate: unknown): boolean {
    this.calls += 1;
    return this.result;
  }
}

describe('AndSpecification', () => {
  describe('truth table', () => {
    it('true && true → true', () => {
      const spec = new AndSpecification<unknown>(new FixedSpec(true), new FixedSpec(true));
      expect(spec.isSatisfiedBy(null)).toBe(true);
    });

    it('true && false → false', () => {
      const spec = new AndSpecification<unknown>(new FixedSpec(true), new FixedSpec(false));
      expect(spec.isSatisfiedBy(null)).toBe(false);
    });

    it('false && true → false', () => {
      const spec = new AndSpecification<unknown>(new FixedSpec(false), new FixedSpec(true));
      expect(spec.isSatisfiedBy(null)).toBe(false);
    });

    it('false && false → false', () => {
      const spec = new AndSpecification<unknown>(new FixedSpec(false), new FixedSpec(false));
      expect(spec.isSatisfiedBy(null)).toBe(false);
    });
  });

  describe('lazy evaluation', () => {
    it('does not evaluate right when left is false (short-circuit)', () => {
      const left = new FixedSpec(false);
      const right = new FixedSpec(true);
      const spec = new AndSpecification<unknown>(left, right);
      spec.isSatisfiedBy(null);
      expect(left.calls).toBe(1);
      expect(right.calls).toBe(0);
    });

    it('evaluates right when left is true', () => {
      const left = new FixedSpec(true);
      const right = new FixedSpec(true);
      const spec = new AndSpecification<unknown>(left, right);
      spec.isSatisfiedBy(null);
      expect(left.calls).toBe(1);
      expect(right.calls).toBe(1);
    });
  });

  describe('composition via inheritance', () => {
    it('supports chaining .and() through CompositeSpecification', () => {
      const a: ISpecification<unknown> = new FixedSpec(true);
      const b: ISpecification<unknown> = new FixedSpec(true);
      const c: ISpecification<unknown> = new FixedSpec(true);
      const chained = new AndSpecification<unknown>(a, b).and(c);
      expect(chained.isSatisfiedBy(null)).toBe(true);
    });

    it('supports chaining .or()', () => {
      const a: ISpecification<unknown> = new FixedSpec(false);
      const b: ISpecification<unknown> = new FixedSpec(false);
      const c: ISpecification<unknown> = new FixedSpec(true);
      const chained = new AndSpecification<unknown>(a, b).or(c);
      expect(chained.isSatisfiedBy(null)).toBe(true);
    });

    it('supports .not() on AndSpecification', () => {
      const a: ISpecification<unknown> = new FixedSpec(true);
      const b: ISpecification<unknown> = new FixedSpec(true);
      const negated = new AndSpecification<unknown>(a, b).not();
      expect(negated.isSatisfiedBy(null)).toBe(false);
    });
  });
});
