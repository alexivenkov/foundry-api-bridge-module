import {
  AlwaysTrueSpecification,
  CompositeSpecification,
} from '@/kernel/domain/specification';
import type { FilterableRepository } from '@/kernel/domain/repository';
import { PaginationParams } from '@/kernel/domain/value-objects';

import { executeFilterQuery } from '../FilterQueryService';

interface Item {
  readonly id: number;
  readonly name: string;
}

class Predicate<T> extends CompositeSpecification<T> {
  constructor(private readonly fn: (candidate: T) => boolean) {
    super();
  }

  override isSatisfiedBy(candidate: T): boolean {
    return this.fn(candidate);
  }
}

const byId = (a: Item, b: Item): number => a.id - b.id;

const makeItems = (count: number): Item[] =>
  Array.from({ length: count }, (_, i) => ({ id: i + 1, name: `item-${String(i + 1)}` }));

const makeRepository = (items: readonly Item[]): FilterableRepository<Item> => ({
  findAll: jest.fn().mockResolvedValue(items),
});

describe('executeFilterQuery', () => {
  describe('empty repository', () => {
    it('returns empty result for an empty repository', async () => {
      const repository = makeRepository([]);
      const result = await executeFilterQuery({
        repository,
        specification: new AlwaysTrueSpecification<Item>(),
        comparator: byId,
        pagination: new PaginationParams(10, 0),
      });

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('AlwaysTrue spec, no pagination overflow', () => {
    it('returns all 5 items, total=5, hasMore=false', async () => {
      const items = makeItems(5);
      const repository = makeRepository(items);
      const result = await executeFilterQuery({
        repository,
        specification: new AlwaysTrueSpecification<Item>(),
        comparator: byId,
        pagination: new PaginationParams(10, 0),
      });

      expect(result.items).toHaveLength(5);
      expect(result.total).toBe(5);
      expect(result.hasMore).toBe(false);
      expect(result.items.map((i) => i.id)).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe('filtering + pagination with overflow', () => {
    it('100 items, half match, limit=10 offset=0 → page=10 total=50 hasMore=true', async () => {
      const items = makeItems(100);
      const repository = makeRepository(items);
      const evenOnly = new Predicate<Item>((item) => item.id % 2 === 0);

      const result = await executeFilterQuery({
        repository,
        specification: evenOnly,
        comparator: byId,
        pagination: new PaginationParams(10, 0),
      });

      expect(result.items).toHaveLength(10);
      expect(result.total).toBe(50);
      expect(result.hasMore).toBe(true);
      expect(result.items.map((i) => i.id)).toEqual([2, 4, 6, 8, 10, 12, 14, 16, 18, 20]);
    });

    it('limit=10 offset=45 on total=50 → page=5 hasMore=false', async () => {
      const items = makeItems(100);
      const repository = makeRepository(items);
      const evenOnly = new Predicate<Item>((item) => item.id % 2 === 0);

      const result = await executeFilterQuery({
        repository,
        specification: evenOnly,
        comparator: byId,
        pagination: new PaginationParams(10, 45),
      });

      expect(result.items).toHaveLength(5);
      expect(result.total).toBe(50);
      expect(result.hasMore).toBe(false);
      expect(result.items.map((i) => i.id)).toEqual([92, 94, 96, 98, 100]);
    });
  });

  describe('comparator ordering', () => {
    it('sorts results using the supplied comparator (ascending by id)', async () => {
      const items: Item[] = [
        { id: 5, name: 'e' },
        { id: 1, name: 'a' },
        { id: 3, name: 'c' },
        { id: 2, name: 'b' },
        { id: 4, name: 'd' },
      ];
      const repository = makeRepository(items);
      const result = await executeFilterQuery({
        repository,
        specification: new AlwaysTrueSpecification<Item>(),
        comparator: byId,
        pagination: new PaginationParams(10, 0),
      });

      expect(result.items.map((i) => i.id)).toEqual([1, 2, 3, 4, 5]);
    });

    it('sorts results using the supplied comparator (descending by id)', async () => {
      const items = makeItems(5);
      const repository = makeRepository(items);
      const byIdDesc = (a: Item, b: Item): number => b.id - a.id;
      const result = await executeFilterQuery({
        repository,
        specification: new AlwaysTrueSpecification<Item>(),
        comparator: byIdDesc,
        pagination: new PaginationParams(10, 0),
      });

      expect(result.items.map((i) => i.id)).toEqual([5, 4, 3, 2, 1]);
    });
  });

  describe('repository interaction', () => {
    it('calls repository.findAll() exactly once per query', async () => {
      const items = makeItems(3);
      const repository = makeRepository(items);
      await executeFilterQuery({
        repository,
        specification: new AlwaysTrueSpecification<Item>(),
        comparator: byId,
        pagination: new PaginationParams(10, 0),
      });

      expect(repository.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('specification interaction', () => {
    it('invokes specification.isSatisfiedBy for every item in the repository', async () => {
      const items = makeItems(7);
      const repository = makeRepository(items);
      const isSatisfiedBy = jest.fn().mockReturnValue(true);
      const spec = { isSatisfiedBy } as unknown as AlwaysTrueSpecification<Item>;

      await executeFilterQuery({
        repository,
        specification: spec,
        comparator: byId,
        pagination: new PaginationParams(10, 0),
      });

      expect(isSatisfiedBy).toHaveBeenCalledTimes(7);
      for (const item of items) {
        expect(isSatisfiedBy).toHaveBeenCalledWith(item);
      }
    });
  });

  describe('immutability of inputs', () => {
    it('does not mutate the repository array order', async () => {
      const original: Item[] = [
        { id: 5, name: 'e' },
        { id: 1, name: 'a' },
        { id: 3, name: 'c' },
        { id: 2, name: 'b' },
        { id: 4, name: 'd' },
      ];
      const snapshot = original.map((i) => i.id);
      const repository = makeRepository(original);

      await executeFilterQuery({
        repository,
        specification: new AlwaysTrueSpecification<Item>(),
        comparator: byId,
        pagination: new PaginationParams(10, 0),
      });

      expect(original.map((i) => i.id)).toEqual(snapshot);
    });
  });
});
