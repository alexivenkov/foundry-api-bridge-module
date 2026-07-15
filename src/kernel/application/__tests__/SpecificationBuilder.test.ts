import { CompositeSpecification } from '@/kernel/domain/specification';
import type { ISpecification } from '@/kernel/domain/specification';

import { SpecificationBuilder } from '../SpecificationBuilder';
import type { SpecificationFactory } from '../SpecificationBuilder';

class Predicate<T> extends CompositeSpecification<T> {
  constructor(private readonly fn: (candidate: T) => boolean) {
    super();
  }

  override isSatisfiedBy(candidate: T): boolean {
    return this.fn(candidate);
  }
}

interface Query {
  readonly minValue?: number;
  readonly maxValue?: number;
  readonly exact?: number;
}

describe('SpecificationBuilder', () => {
  describe('empty factories', () => {
    it('returns AlwaysTrue-equivalent when factories array is empty', () => {
      const builder = new SpecificationBuilder<Query, number>([]);
      const spec = builder.build({});

      expect(spec.isSatisfiedBy(0)).toBe(true);
      expect(spec.isSatisfiedBy(42)).toBe(true);
      expect(spec.isSatisfiedBy(-100)).toBe(true);
    });
  });

  describe('null-returning factories', () => {
    it('returns AlwaysTrue-equivalent when every factory returns null', () => {
      const factories: ReadonlyArray<SpecificationFactory<Query, number>> = [
        () => null,
        () => null,
        () => null,
      ];
      const builder = new SpecificationBuilder<Query, number>(factories);
      const spec = builder.build({});

      expect(spec.isSatisfiedBy(0)).toBe(true);
      expect(spec.isSatisfiedBy(123)).toBe(true);
    });

    it('skips null-returning factories and uses only real specs', () => {
      const factories: ReadonlyArray<SpecificationFactory<Query, number>> = [
        () => null,
        (q) =>
          q.minValue !== undefined ? new Predicate<number>((n) => n >= (q.minValue ?? 0)) : null,
        () => null,
      ];
      const builder = new SpecificationBuilder<Query, number>(factories);
      const spec = builder.build({ minValue: 10 });

      expect(spec.isSatisfiedBy(15)).toBe(true);
      expect(spec.isSatisfiedBy(10)).toBe(true);
      expect(spec.isSatisfiedBy(5)).toBe(false);
    });
  });

  describe('single factory', () => {
    it('applies the spec when factory returns a non-null spec', () => {
      const factory: SpecificationFactory<Query, number> = () =>
        new Predicate<number>((n) => n > 0);
      const builder = new SpecificationBuilder<Query, number>([factory]);
      const spec = builder.build({});

      expect(spec.isSatisfiedBy(5)).toBe(true);
      expect(spec.isSatisfiedBy(-1)).toBe(false);
      expect(spec.isSatisfiedBy(0)).toBe(false);
    });
  });

  describe('multiple factories — AND composition', () => {
    it('combines three real specs with AND (all true → true)', () => {
      const factories: ReadonlyArray<SpecificationFactory<Query, number>> = [
        () => new Predicate<number>((n) => n > 0),
        () => new Predicate<number>((n) => n % 2 === 0),
        () => new Predicate<number>((n) => n < 100),
      ];
      const builder = new SpecificationBuilder<Query, number>(factories);
      const spec = builder.build({});

      expect(spec.isSatisfiedBy(4)).toBe(true);
      expect(spec.isSatisfiedBy(98)).toBe(true);
    });

    it('combines three real specs with AND (any false → false)', () => {
      const factories: ReadonlyArray<SpecificationFactory<Query, number>> = [
        () => new Predicate<number>((n) => n > 0),
        () => new Predicate<number>((n) => n % 2 === 0),
        () => new Predicate<number>((n) => n < 100),
      ];
      const builder = new SpecificationBuilder<Query, number>(factories);
      const spec = builder.build({});

      expect(spec.isSatisfiedBy(3)).toBe(false); // odd
      expect(spec.isSatisfiedBy(-2)).toBe(false); // not positive
      expect(spec.isSatisfiedBy(200)).toBe(false); // too big
    });

    it('mixes null and non-null factories — AND only the real specs', () => {
      const factories: ReadonlyArray<SpecificationFactory<Query, number>> = [
        () => new Predicate<number>((n) => n > 0),
        () => null,
        () => new Predicate<number>((n) => n < 50),
        () => null,
      ];
      const builder = new SpecificationBuilder<Query, number>(factories);
      const spec = builder.build({});

      expect(spec.isSatisfiedBy(25)).toBe(true);
      expect(spec.isSatisfiedBy(-1)).toBe(false);
      expect(spec.isSatisfiedBy(75)).toBe(false);
    });
  });

  describe('query is forwarded to each factory', () => {
    it('passes the same query reference to every factory call', () => {
      const query: Query = { minValue: 5, maxValue: 50, exact: 10 };
      const seen: Query[] = [];
      const factories: ReadonlyArray<SpecificationFactory<Query, number>> = [
        (q) => {
          seen.push(q);
          return null;
        },
        (q) => {
          seen.push(q);
          return null;
        },
        (q) => {
          seen.push(q);
          return null;
        },
      ];
      const builder = new SpecificationBuilder<Query, number>(factories);
      builder.build(query);

      expect(seen).toHaveLength(3);
      expect(seen[0]).toBe(query);
      expect(seen[1]).toBe(query);
      expect(seen[2]).toBe(query);
    });

    it('uses query data to drive spec construction', () => {
      const factories: ReadonlyArray<SpecificationFactory<Query, number>> = [
        (q) =>
          q.minValue !== undefined ? new Predicate<number>((n) => n >= (q.minValue ?? 0)) : null,
        (q) =>
          q.maxValue !== undefined
            ? new Predicate<number>((n) => n <= (q.maxValue ?? Infinity))
            : null,
      ];
      const builder = new SpecificationBuilder<Query, number>(factories);
      const spec = builder.build({ minValue: 10, maxValue: 20 });

      expect(spec.isSatisfiedBy(15)).toBe(true);
      expect(spec.isSatisfiedBy(10)).toBe(true);
      expect(spec.isSatisfiedBy(20)).toBe(true);
      expect(spec.isSatisfiedBy(9)).toBe(false);
      expect(spec.isSatisfiedBy(21)).toBe(false);
    });
  });

  describe('immutability', () => {
    it('builder.build() with different queries produces independent specs', () => {
      const factories: ReadonlyArray<SpecificationFactory<Query, number>> = [
        (q) =>
          q.exact !== undefined ? new Predicate<number>((n) => n === q.exact) : null,
      ];
      const builder = new SpecificationBuilder<Query, number>(factories);

      const spec1 = builder.build({ exact: 5 });
      const spec2 = builder.build({ exact: 10 });

      expect(spec1.isSatisfiedBy(5)).toBe(true);
      expect(spec1.isSatisfiedBy(10)).toBe(false);
      expect(spec2.isSatisfiedBy(10)).toBe(true);
      expect(spec2.isSatisfiedBy(5)).toBe(false);
    });

    it('factories are not invoked at construction time', () => {
      const factory = jest.fn<ISpecification<number> | null, [Query]>().mockReturnValue(null);
      new SpecificationBuilder<Query, number>([factory]);

      expect(factory).not.toHaveBeenCalled();
    });

    it('each build() call invokes each factory exactly once', () => {
      const factory1 = jest.fn<ISpecification<number> | null, [Query]>().mockReturnValue(null);
      const factory2 = jest
        .fn<ISpecification<number> | null, [Query]>()
        .mockReturnValue(new Predicate<number>(() => true));
      const builder = new SpecificationBuilder<Query, number>([factory1, factory2]);

      builder.build({});
      builder.build({});

      expect(factory1).toHaveBeenCalledTimes(2);
      expect(factory2).toHaveBeenCalledTimes(2);
    });
  });
});
