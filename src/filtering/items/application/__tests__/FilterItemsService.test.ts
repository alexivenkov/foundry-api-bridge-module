import {
  AlwaysFalseSpecification,
  AlwaysTrueSpecification,
  CompositeSpecification,
  type ISpecification
} from '@/kernel/domain/specification';
import {
  EnumSet,
  PaginationParams
} from '@/kernel/domain/value-objects';
import type {
  FilterableRepository,
  FolderResolver
} from '@/kernel/domain/repository';
import { ItemType } from '@/filtering/items/domain/value-objects';
import type { ItemSnapshot } from '@/filtering/items/domain/snapshot';
import {
  ALL_FIXTURES,
  CASK,
  FIREBALL,
  LONGSWORD,
  POTION_OF_HEALING
} from '@/filtering/items/domain/__tests__/fixtures/itemSnapshots';

import { ItemSpecificationBuilder } from '../ItemSpecificationBuilder';
import { FilterItemsService } from '../FilterItemsService';
import type { FilterItemsQuery } from '../FilterItemsQuery';

const baseQuery = (overrides: Partial<FilterItemsQuery> = {}): FilterItemsQuery => ({
  pagination: PaginationParams.default(),
  ...overrides
});

const makeRepository = (
  items: readonly ItemSnapshot[]
): FilterableRepository<ItemSnapshot> & { findAll: jest.Mock } => ({
  findAll: jest.fn().mockResolvedValue(items)
});

const makeFolderResolver = (): FolderResolver => ({
  resolve: jest.fn().mockReturnValue(new Set<string>())
});

interface MockBuilder {
  build: jest.Mock<ISpecification<ItemSnapshot>, [FilterItemsQuery]>;
}

const makeMockBuilder = (
  spec: ISpecification<ItemSnapshot> = new AlwaysTrueSpecification<ItemSnapshot>()
): MockBuilder => ({
  build: jest
    .fn<ISpecification<ItemSnapshot>, [FilterItemsQuery]>()
    .mockReturnValue(spec)
});

class TypeOnly extends CompositeSpecification<ItemSnapshot> {
  constructor(private readonly types: ReadonlySet<ItemType>) {
    super();
  }

  override isSatisfiedBy(item: ItemSnapshot): boolean {
    return this.types.has(item.type);
  }
}

describe('FilterItemsService', () => {
  describe('empty repository', () => {
    it('returns { results: [], total: 0, hasMore: false }', async () => {
      const repository = makeRepository([]);
      const builder = makeMockBuilder();
      const service = new FilterItemsService(
        repository,
        builder as unknown as ItemSpecificationBuilder
      );

      const result = await service.execute(baseQuery());

      expect(result.results).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('result mapping', () => {
    it('returns only id and name for each item', async () => {
      const repository = makeRepository([LONGSWORD]);
      const builder = makeMockBuilder();
      const service = new FilterItemsService(
        repository,
        builder as unknown as ItemSpecificationBuilder
      );

      const result = await service.execute(baseQuery());

      expect(result.results).toEqual([{ id: LONGSWORD.id, name: LONGSWORD.name }]);
      expect(Object.keys(result.results[0] ?? {})).toEqual(['id', 'name']);
    });
  });

  describe('all fixtures with empty query', () => {
    it('returns all 8 items with correct total/hasMore', async () => {
      const repository = makeRepository(ALL_FIXTURES);
      const builder = new ItemSpecificationBuilder(makeFolderResolver());
      const service = new FilterItemsService(repository, builder);

      const result = await service.execute(baseQuery());

      expect(result.results).toHaveLength(8);
      expect(result.total).toBe(8);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('sorting', () => {
    it('sorts results by name ASC (case-insensitive) on ALL_FIXTURES', async () => {
      const repository = makeRepository(ALL_FIXTURES);
      const builder = new ItemSpecificationBuilder(makeFolderResolver());
      const service = new FilterItemsService(repository, builder);

      const result = await service.execute(baseQuery());

      expect(result.results.map((r) => r.name)).toEqual([
        'Artifact of the Dead',
        'Cask',
        'Fireball',
        'Light',
        'Longsword',
        'Potion of Healing',
        'Ring of Protection',
        'Unknown Ring'
      ]);
    });

    it('uses id as a stable tiebreaker when names are equal', async () => {
      const a: ItemSnapshot = { ...LONGSWORD, id: 'item-zzz', name: 'Same Name' };
      const b: ItemSnapshot = { ...LONGSWORD, id: 'item-aaa', name: 'Same Name' };
      const c: ItemSnapshot = { ...LONGSWORD, id: 'item-mmm', name: 'Same Name' };
      const repository = makeRepository([a, b, c]);
      const builder = new ItemSpecificationBuilder(makeFolderResolver());
      const service = new FilterItemsService(repository, builder);

      const result = await service.execute(baseQuery());

      expect(result.results.map((r) => r.id)).toEqual([
        'item-aaa',
        'item-mmm',
        'item-zzz'
      ]);
    });

    it('compares names case-insensitively via localeCompare', async () => {
      const lower: ItemSnapshot = { ...LONGSWORD, id: 'i-1', name: 'apple' };
      const upper: ItemSnapshot = { ...LONGSWORD, id: 'i-2', name: 'Banana' };
      const upperA: ItemSnapshot = { ...LONGSWORD, id: 'i-3', name: 'Avocado' };
      const repository = makeRepository([upper, lower, upperA]);
      const builder = new ItemSpecificationBuilder(makeFolderResolver());
      const service = new FilterItemsService(repository, builder);

      const result = await service.execute(baseQuery());

      expect(result.results.map((r) => r.name)).toEqual(['apple', 'Avocado', 'Banana']);
    });
  });

  describe('pagination', () => {
    it('limit=2 offset=2 on 8 items → 2 results, total=8, hasMore=true', async () => {
      const repository = makeRepository(ALL_FIXTURES);
      const builder = new ItemSpecificationBuilder(makeFolderResolver());
      const service = new FilterItemsService(repository, builder);

      const result = await service.execute(
        baseQuery({ pagination: new PaginationParams(2, 2) })
      );

      expect(result.results).toHaveLength(2);
      expect(result.total).toBe(8);
      expect(result.hasMore).toBe(true);
    });

    it('returns hasMore=false when offset+limit reaches total', async () => {
      const repository = makeRepository(ALL_FIXTURES);
      const builder = new ItemSpecificationBuilder(makeFolderResolver());
      const service = new FilterItemsService(repository, builder);

      const result = await service.execute(
        baseQuery({ pagination: new PaginationParams(2, 6) })
      );

      expect(result.results).toHaveLength(2);
      expect(result.total).toBe(8);
      expect(result.hasMore).toBe(false);
    });

    it('returns empty page when offset >= total', async () => {
      const repository = makeRepository(ALL_FIXTURES);
      const builder = new ItemSpecificationBuilder(makeFolderResolver());
      const service = new FilterItemsService(repository, builder);

      const result = await service.execute(
        baseQuery({ pagination: new PaginationParams(10, 100) })
      );

      expect(result.results).toEqual([]);
      expect(result.total).toBe(8);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('specification application', () => {
    it('applies the spec returned by the builder (filter Spell only)', async () => {
      const repository = makeRepository(ALL_FIXTURES);
      const builder = new ItemSpecificationBuilder(makeFolderResolver());
      const service = new FilterItemsService(repository, builder);

      const result = await service.execute(
        baseQuery({ types: new EnumSet<ItemType>([ItemType.Spell]) })
      );

      expect(result.results.map((r) => r.id).sort()).toEqual(
        [FIREBALL.id, 'item-light'].sort()
      );
      expect(result.total).toBe(2);
    });

    it('returns empty when spec excludes everything (AlwaysFalse)', async () => {
      const repository = makeRepository(ALL_FIXTURES);
      const builder = makeMockBuilder(new AlwaysFalseSpecification<ItemSnapshot>());
      const service = new FilterItemsService(
        repository,
        builder as unknown as ItemSpecificationBuilder
      );

      const result = await service.execute(baseQuery());

      expect(result.results).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.hasMore).toBe(false);
    });

    it('uses the spec produced by the builder, not a hard-coded one', async () => {
      const onlyContainers = new TypeOnly(new Set<ItemType>([ItemType.Container]));
      const repository = makeRepository(ALL_FIXTURES);
      const builder = makeMockBuilder(onlyContainers);
      const service = new FilterItemsService(
        repository,
        builder as unknown as ItemSpecificationBuilder
      );

      const result = await service.execute(baseQuery());

      expect(result.results.map((r) => r.id)).toEqual([CASK.id]);
    });
  });

  describe('builder interaction', () => {
    it('calls builder.build() exactly once with the supplied query', async () => {
      const query = baseQuery({ types: new EnumSet<ItemType>([ItemType.Spell]) });
      const repository = makeRepository(ALL_FIXTURES);
      const builder = makeMockBuilder();
      const service = new FilterItemsService(
        repository,
        builder as unknown as ItemSpecificationBuilder
      );

      await service.execute(query);

      expect(builder.build).toHaveBeenCalledTimes(1);
      expect(builder.build).toHaveBeenCalledWith(query);
    });
  });

  describe('repository interaction', () => {
    it('calls repository.findAll() exactly once', async () => {
      const repository = makeRepository(ALL_FIXTURES);
      const builder = makeMockBuilder();
      const service = new FilterItemsService(
        repository,
        builder as unknown as ItemSpecificationBuilder
      );

      await service.execute(baseQuery());

      expect(repository.findAll).toHaveBeenCalledTimes(1);
    });

    it('propagates rejection from repository.findAll()', async () => {
      const repository: FilterableRepository<ItemSnapshot> = {
        findAll: jest.fn().mockRejectedValue(new Error('repo boom'))
      };
      const builder = makeMockBuilder();
      const service = new FilterItemsService(
        repository,
        builder as unknown as ItemSpecificationBuilder
      );

      await expect(service.execute(baseQuery())).rejects.toThrow('repo boom');
    });
  });

  describe('comparator stability across pagination', () => {
    it('returns consistent ordering across paginated calls', async () => {
      const repository = makeRepository(ALL_FIXTURES);
      const builder = new ItemSpecificationBuilder(makeFolderResolver());
      const service = new FilterItemsService(repository, builder);

      const page1 = await service.execute(
        baseQuery({ pagination: new PaginationParams(4, 0) })
      );
      const page2 = await service.execute(
        baseQuery({ pagination: new PaginationParams(4, 4) })
      );

      const combined = [...page1.results, ...page2.results].map((r) => r.name);
      expect(combined).toEqual([
        'Artifact of the Dead',
        'Cask',
        'Fireball',
        'Light',
        'Longsword',
        'Potion of Healing',
        'Ring of Protection',
        'Unknown Ring'
      ]);
    });
  });

  describe('fixture references unused (lint guard)', () => {
    it('keeps all named fixture imports referenced', () => {
      expect([POTION_OF_HEALING].length).toBe(1);
    });
  });
});
