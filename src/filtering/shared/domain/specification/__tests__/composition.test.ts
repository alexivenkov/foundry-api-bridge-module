import { AlwaysFalseSpecification } from '../AlwaysFalseSpecification';
import { AlwaysTrueSpecification } from '../AlwaysTrueSpecification';
import { CompositeSpecification } from '../CompositeSpecification';

class Predicate<T> extends CompositeSpecification<T> {
  constructor(private readonly fn: (candidate: T) => boolean) {
    super();
  }

  override isSatisfiedBy(candidate: T): boolean {
    return this.fn(candidate);
  }
}

describe('Specification composition', () => {
  describe('AND chains', () => {
    it('spec1.and(spec2).and(spec3) — all true → true', () => {
      const isPositive = new Predicate<number>((n) => n > 0);
      const isEven = new Predicate<number>((n) => n % 2 === 0);
      const isLessThan100 = new Predicate<number>((n) => n < 100);
      const composed = isPositive.and(isEven).and(isLessThan100);

      expect(composed.isSatisfiedBy(4)).toBe(true);
      expect(composed.isSatisfiedBy(98)).toBe(true);
    });

    it('spec1.and(spec2).and(spec3) — one false → false', () => {
      const isPositive = new Predicate<number>((n) => n > 0);
      const isEven = new Predicate<number>((n) => n % 2 === 0);
      const isLessThan100 = new Predicate<number>((n) => n < 100);
      const composed = isPositive.and(isEven).and(isLessThan100);

      expect(composed.isSatisfiedBy(3)).toBe(false); // odd
      expect(composed.isSatisfiedBy(-2)).toBe(false); // negative
      expect(composed.isSatisfiedBy(200)).toBe(false); // too big
    });
  });

  describe('OR chains with AND mixing', () => {
    it('(a OR b) AND c — left-associative chaining', () => {
      const a = new Predicate<number>((n) => n === 1);
      const b = new Predicate<number>((n) => n === 2);
      const c = new Predicate<number>((n) => n > 0);
      const composed = a.or(b).and(c);

      expect(composed.isSatisfiedBy(1)).toBe(true);
      expect(composed.isSatisfiedBy(2)).toBe(true);
      expect(composed.isSatisfiedBy(3)).toBe(false);
    });

    it('a OR (b AND c) — explicit grouping via inner.and(...)', () => {
      const a = new Predicate<number>((n) => n === 1);
      const b = new Predicate<number>((n) => n > 5);
      const c = new Predicate<number>((n) => n < 10);
      const composed = a.or(b.and(c));

      expect(composed.isSatisfiedBy(1)).toBe(true); // a
      expect(composed.isSatisfiedBy(7)).toBe(true); // b AND c
      expect(composed.isSatisfiedBy(3)).toBe(false); // neither
      expect(composed.isSatisfiedBy(20)).toBe(false); // b but not c
    });
  });

  describe('negation of composites', () => {
    it('(spec1 AND spec2).not() — De Morgan equivalent', () => {
      const isPositive = new Predicate<number>((n) => n > 0);
      const isEven = new Predicate<number>((n) => n % 2 === 0);
      const negated = isPositive.and(isEven).not();

      expect(negated.isSatisfiedBy(4)).toBe(false); // both true
      expect(negated.isSatisfiedBy(3)).toBe(true); // odd
      expect(negated.isSatisfiedBy(-2)).toBe(true); // negative
    });

    it('(spec1 OR spec2).not()', () => {
      const a = new Predicate<number>((n) => n === 1);
      const b = new Predicate<number>((n) => n === 2);
      const negated = a.or(b).not();

      expect(negated.isSatisfiedBy(1)).toBe(false);
      expect(negated.isSatisfiedBy(2)).toBe(false);
      expect(negated.isSatisfiedBy(3)).toBe(true);
    });
  });

  describe('AlwaysTrue / AlwaysFalse as neutral elements', () => {
    it('AlwaysTrue.and(spec) ≡ spec', () => {
      const spec = new Predicate<number>((n) => n > 10);
      const composed = new AlwaysTrueSpecification<number>().and(spec);

      expect(composed.isSatisfiedBy(20)).toBe(true);
      expect(composed.isSatisfiedBy(5)).toBe(false);
    });

    it('spec.and(AlwaysTrue) ≡ spec', () => {
      const spec = new Predicate<number>((n) => n > 10);
      const composed = spec.and(new AlwaysTrueSpecification<number>());

      expect(composed.isSatisfiedBy(20)).toBe(true);
      expect(composed.isSatisfiedBy(5)).toBe(false);
    });

    it('AlwaysFalse.or(spec) ≡ spec', () => {
      const spec = new Predicate<number>((n) => n > 10);
      const composed = new AlwaysFalseSpecification<number>().or(spec);

      expect(composed.isSatisfiedBy(20)).toBe(true);
      expect(composed.isSatisfiedBy(5)).toBe(false);
    });

    it('spec.or(AlwaysFalse) ≡ spec', () => {
      const spec = new Predicate<number>((n) => n > 10);
      const composed = spec.or(new AlwaysFalseSpecification<number>());

      expect(composed.isSatisfiedBy(20)).toBe(true);
      expect(composed.isSatisfiedBy(5)).toBe(false);
    });

    it('AlwaysTrue.or(anything) is always true', () => {
      const composed = new AlwaysTrueSpecification<number>().or(new AlwaysFalseSpecification<number>());
      expect(composed.isSatisfiedBy(0)).toBe(true);
    });

    it('AlwaysFalse.and(anything) is always false', () => {
      const composed = new AlwaysFalseSpecification<number>().and(new AlwaysTrueSpecification<number>());
      expect(composed.isSatisfiedBy(0)).toBe(false);
    });
  });

  describe('deep nesting', () => {
    it('spec1.and(spec2.or(spec3.not())) evaluates correctly', () => {
      const isPositive = new Predicate<number>((n) => n > 0);
      const isEven = new Predicate<number>((n) => n % 2 === 0);
      const isMultipleOfThree = new Predicate<number>((n) => n % 3 === 0);

      // positive AND (even OR (NOT multipleOfThree))
      const composed = isPositive.and(isEven.or(isMultipleOfThree.not()));

      expect(composed.isSatisfiedBy(4)).toBe(true); // positive, even
      expect(composed.isSatisfiedBy(7)).toBe(true); // positive, odd, not mult-of-3
      expect(composed.isSatisfiedBy(9)).toBe(false); // positive, odd, mult-of-3
      expect(composed.isSatisfiedBy(-4)).toBe(false); // negative
    });

    it('preserves immutability — composition does not mutate operands', () => {
      const a = new Predicate<number>((n) => n > 0);
      const b = new Predicate<number>((n) => n < 10);
      const aAndB = a.and(b);
      const aOrB = a.or(b);

      expect(a.isSatisfiedBy(5)).toBe(true);
      expect(b.isSatisfiedBy(5)).toBe(true);
      expect(aAndB.isSatisfiedBy(5)).toBe(true);
      expect(aOrB.isSatisfiedBy(5)).toBe(true);
      expect(aAndB.isSatisfiedBy(15)).toBe(false);
      expect(aOrB.isSatisfiedBy(15)).toBe(true);
    });
  });
});
