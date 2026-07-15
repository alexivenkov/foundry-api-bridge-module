import { CompositeSpecification } from '../CompositeSpecification';
import { OrSpecification } from '../OrSpecification';
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

describe('OrSpecification', () => {
  describe('truth table', () => {
    it('true || true → true', () => {
      const spec = new OrSpecification<unknown>(new FixedSpec(true), new FixedSpec(true));
      expect(spec.isSatisfiedBy(null)).toBe(true);
    });

    it('true || false → true', () => {
      const spec = new OrSpecification<unknown>(new FixedSpec(true), new FixedSpec(false));
      expect(spec.isSatisfiedBy(null)).toBe(true);
    });

    it('false || true → true', () => {
      const spec = new OrSpecification<unknown>(new FixedSpec(false), new FixedSpec(true));
      expect(spec.isSatisfiedBy(null)).toBe(true);
    });

    it('false || false → false', () => {
      const spec = new OrSpecification<unknown>(new FixedSpec(false), new FixedSpec(false));
      expect(spec.isSatisfiedBy(null)).toBe(false);
    });
  });

  describe('lazy evaluation', () => {
    it('does not evaluate right when left is true (short-circuit)', () => {
      const left = new FixedSpec(true);
      const right = new FixedSpec(false);
      const spec = new OrSpecification<unknown>(left, right);
      spec.isSatisfiedBy(null);
      expect(left.calls).toBe(1);
      expect(right.calls).toBe(0);
    });

    it('evaluates right when left is false', () => {
      const left = new FixedSpec(false);
      const right = new FixedSpec(false);
      const spec = new OrSpecification<unknown>(left, right);
      spec.isSatisfiedBy(null);
      expect(left.calls).toBe(1);
      expect(right.calls).toBe(1);
    });
  });

  describe('composition via inheritance', () => {
    it('supports chaining .and() on OrSpecification', () => {
      const a: ISpecification<unknown> = new FixedSpec(false);
      const b: ISpecification<unknown> = new FixedSpec(true);
      const c: ISpecification<unknown> = new FixedSpec(true);
      const chained = new OrSpecification<unknown>(a, b).and(c);
      expect(chained.isSatisfiedBy(null)).toBe(true);
    });

    it('supports chaining .or()', () => {
      const a: ISpecification<unknown> = new FixedSpec(false);
      const b: ISpecification<unknown> = new FixedSpec(false);
      const c: ISpecification<unknown> = new FixedSpec(false);
      const chained = new OrSpecification<unknown>(a, b).or(c);
      expect(chained.isSatisfiedBy(null)).toBe(false);
    });

    it('supports .not() on OrSpecification', () => {
      const a: ISpecification<unknown> = new FixedSpec(false);
      const b: ISpecification<unknown> = new FixedSpec(false);
      const negated = new OrSpecification<unknown>(a, b).not();
      expect(negated.isSatisfiedBy(null)).toBe(true);
    });
  });
});
