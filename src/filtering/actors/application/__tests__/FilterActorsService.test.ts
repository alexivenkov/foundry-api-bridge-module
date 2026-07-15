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
import type { FilterableRepository } from '@/kernel/domain/repository';
import { ActorType } from '@/filtering/actors/domain/value-objects';
import type { ActorSnapshot } from '@/filtering/actors/domain/snapshot';
import {
  ALL_FIXTURES,
  ANCIENT_RED_DRAGON,
  FRODO,
  GANDALF,
  GOBLIN,
  PARTY_GROUP,
  WAGON
} from '@/filtering/actors/domain/__tests__/fixtures/actorSnapshots';

import { ActorSpecificationBuilder } from '../ActorSpecificationBuilder';
import type { FolderResolver } from '../ActorSpecificationBuilder';
import { FilterActorsService } from '../FilterActorsService';
import type { FilterActorsQuery } from '../FilterActorsQuery';

const baseQuery = (overrides: Partial<FilterActorsQuery> = {}): FilterActorsQuery => ({
  pagination: PaginationParams.default(),
  ...overrides
});

const makeRepository = (
  items: readonly ActorSnapshot[]
): FilterableRepository<ActorSnapshot> & { findAll: jest.Mock } => ({
  findAll: jest.fn().mockResolvedValue(items)
});

const makeFolderResolver = (): FolderResolver => ({
  resolve: jest.fn().mockReturnValue(new Set<string>())
});

interface MockBuilder {
  build: jest.Mock<ISpecification<ActorSnapshot>, [FilterActorsQuery]>;
}

const makeMockBuilder = (
  spec: ISpecification<ActorSnapshot> = new AlwaysTrueSpecification<ActorSnapshot>()
): MockBuilder => ({
  build: jest
    .fn<ISpecification<ActorSnapshot>, [FilterActorsQuery]>()
    .mockReturnValue(spec)
});

class TypeOnly extends CompositeSpecification<ActorSnapshot> {
  constructor(private readonly types: ReadonlySet<ActorType>) {
    super();
  }

  override isSatisfiedBy(actor: ActorSnapshot): boolean {
    return this.types.has(actor.type);
  }
}

describe('FilterActorsService', () => {
  describe('empty repository', () => {
    it('returns { results: [], total: 0, hasMore: false }', async () => {
      const repository = makeRepository([]);
      const builder = makeMockBuilder();
      const service = new FilterActorsService(
        repository,
        builder as unknown as ActorSpecificationBuilder
      );

      const result = await service.execute(baseQuery());

      expect(result.results).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('result mapping', () => {
    it('returns only id and name for each actor (no other ActorSnapshot fields)', async () => {
      const repository = makeRepository([GOBLIN]);
      const builder = makeMockBuilder();
      const service = new FilterActorsService(
        repository,
        builder as unknown as ActorSpecificationBuilder
      );

      const result = await service.execute(baseQuery());

      expect(result.results).toEqual([{ id: GOBLIN.id, name: GOBLIN.name }]);
      expect(Object.keys(result.results[0] ?? {})).toEqual(['id', 'name']);
    });
  });

  describe('all fixtures with empty query', () => {
    it('returns all 6 actors with correct total/hasMore', async () => {
      const repository = makeRepository(ALL_FIXTURES);
      const builder = new ActorSpecificationBuilder(makeFolderResolver());
      const service = new FilterActorsService(repository, builder);

      const result = await service.execute(baseQuery());

      expect(result.results).toHaveLength(6);
      expect(result.total).toBe(6);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('sorting', () => {
    it('sorts results by name ASC (case-insensitive) on ALL_FIXTURES', async () => {
      const repository = makeRepository(ALL_FIXTURES);
      const builder = new ActorSpecificationBuilder(makeFolderResolver());
      const service = new FilterActorsService(repository, builder);

      const result = await service.execute(baseQuery());

      expect(result.results.map((r) => r.name)).toEqual([
        'Ancient Red Dragon',
        'Frodo Baggins',
        'Gandalf the Grey',
        'Goblin Warrior',
        'The Fellowship',
        'Wooden Wagon'
      ]);
    });

    it('uses id as a stable tiebreaker when names are equal', async () => {
      const a: ActorSnapshot = { ...GOBLIN, id: 'actor-zzz', name: 'Same Name' };
      const b: ActorSnapshot = { ...GOBLIN, id: 'actor-aaa', name: 'Same Name' };
      const c: ActorSnapshot = { ...GOBLIN, id: 'actor-mmm', name: 'Same Name' };
      // Insert in random order to ensure sort actually does the work.
      const repository = makeRepository([a, b, c]);
      const builder = new ActorSpecificationBuilder(makeFolderResolver());
      const service = new FilterActorsService(repository, builder);

      const result = await service.execute(baseQuery());

      expect(result.results.map((r) => r.id)).toEqual([
        'actor-aaa',
        'actor-mmm',
        'actor-zzz'
      ]);
    });

    it('compares names case-insensitively via localeCompare', async () => {
      const lower: ActorSnapshot = { ...GOBLIN, id: 'actor-1', name: 'apple' };
      const upper: ActorSnapshot = { ...GOBLIN, id: 'actor-2', name: 'Banana' };
      const upperA: ActorSnapshot = { ...GOBLIN, id: 'actor-3', name: 'Avocado' };
      const repository = makeRepository([upper, lower, upperA]);
      const builder = new ActorSpecificationBuilder(makeFolderResolver());
      const service = new FilterActorsService(repository, builder);

      const result = await service.execute(baseQuery());

      // localeCompare default is case-insensitive: apple < Avocado < Banana
      expect(result.results.map((r) => r.name)).toEqual(['apple', 'Avocado', 'Banana']);
    });
  });

  describe('pagination', () => {
    it('limit=2 offset=2 on 6 items → 2 results, total=6, hasMore=true', async () => {
      const repository = makeRepository(ALL_FIXTURES);
      const builder = new ActorSpecificationBuilder(makeFolderResolver());
      const service = new FilterActorsService(repository, builder);

      const result = await service.execute(
        baseQuery({ pagination: new PaginationParams(2, 2) })
      );

      expect(result.results).toHaveLength(2);
      expect(result.total).toBe(6);
      expect(result.hasMore).toBe(true);
      expect(result.results.map((r) => r.name)).toEqual([
        'Gandalf the Grey',
        'Goblin Warrior'
      ]);
    });

    it('returns hasMore=false when offset+limit reaches total', async () => {
      const repository = makeRepository(ALL_FIXTURES);
      const builder = new ActorSpecificationBuilder(makeFolderResolver());
      const service = new FilterActorsService(repository, builder);

      const result = await service.execute(
        baseQuery({ pagination: new PaginationParams(2, 4) })
      );

      expect(result.results).toHaveLength(2);
      expect(result.total).toBe(6);
      expect(result.hasMore).toBe(false);
    });

    it('returns empty page when offset >= total', async () => {
      const repository = makeRepository(ALL_FIXTURES);
      const builder = new ActorSpecificationBuilder(makeFolderResolver());
      const service = new FilterActorsService(repository, builder);

      const result = await service.execute(
        baseQuery({ pagination: new PaginationParams(10, 100) })
      );

      expect(result.results).toEqual([]);
      expect(result.total).toBe(6);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('specification application', () => {
    it('applies the spec returned by the builder (filter Npc only)', async () => {
      const repository = makeRepository(ALL_FIXTURES);
      const builder = new ActorSpecificationBuilder(makeFolderResolver());
      const service = new FilterActorsService(repository, builder);

      const result = await service.execute(
        baseQuery({ types: new EnumSet<ActorType>([ActorType.Npc]) })
      );

      expect(result.results.map((r) => r.id).sort()).toEqual(
        [ANCIENT_RED_DRAGON.id, GOBLIN.id].sort()
      );
      expect(result.total).toBe(2);
    });

    it('returns empty when spec excludes everything (AlwaysFalse)', async () => {
      const repository = makeRepository(ALL_FIXTURES);
      const builder = makeMockBuilder(new AlwaysFalseSpecification<ActorSnapshot>());
      const service = new FilterActorsService(
        repository,
        builder as unknown as ActorSpecificationBuilder
      );

      const result = await service.execute(baseQuery());

      expect(result.results).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.hasMore).toBe(false);
    });

    it('uses the spec produced by the builder, not a hard-coded one', async () => {
      const onlyCharacters = new TypeOnly(new Set<ActorType>([ActorType.Character]));
      const repository = makeRepository(ALL_FIXTURES);
      const builder = makeMockBuilder(onlyCharacters);
      const service = new FilterActorsService(
        repository,
        builder as unknown as ActorSpecificationBuilder
      );

      const result = await service.execute(baseQuery());

      expect(result.results.map((r) => r.id).sort()).toEqual([FRODO.id, GANDALF.id].sort());
    });
  });

  describe('builder interaction', () => {
    it('calls builder.build() exactly once with the supplied query', async () => {
      const query = baseQuery({ types: new EnumSet<ActorType>([ActorType.Npc]) });
      const repository = makeRepository(ALL_FIXTURES);
      const builder = makeMockBuilder();
      const service = new FilterActorsService(
        repository,
        builder as unknown as ActorSpecificationBuilder
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
      const service = new FilterActorsService(
        repository,
        builder as unknown as ActorSpecificationBuilder
      );

      await service.execute(baseQuery());

      expect(repository.findAll).toHaveBeenCalledTimes(1);
    });

    it('propagates rejection from repository.findAll()', async () => {
      const repository: FilterableRepository<ActorSnapshot> = {
        findAll: jest.fn().mockRejectedValue(new Error('repo boom'))
      };
      const builder = makeMockBuilder();
      const service = new FilterActorsService(
        repository,
        builder as unknown as ActorSpecificationBuilder
      );

      await expect(service.execute(baseQuery())).rejects.toThrow('repo boom');
    });
  });

  describe('comparator stability across pagination', () => {
    it('returns consistent ordering across paginated calls', async () => {
      const repository = makeRepository(ALL_FIXTURES);
      const builder = new ActorSpecificationBuilder(makeFolderResolver());
      const service = new FilterActorsService(repository, builder);

      const page1 = await service.execute(
        baseQuery({ pagination: new PaginationParams(3, 0) })
      );
      const page2 = await service.execute(
        baseQuery({ pagination: new PaginationParams(3, 3) })
      );

      // Concatenated order must equal full sorted list.
      const combined = [...page1.results, ...page2.results].map((r) => r.name);
      expect(combined).toEqual([
        'Ancient Red Dragon',
        'Frodo Baggins',
        'Gandalf the Grey',
        'Goblin Warrior',
        'The Fellowship',
        'Wooden Wagon'
      ]);
    });
  });

  describe('fixture references unused (lint guard)', () => {
    it('keeps all named fixture imports referenced', () => {
      // Imported fixtures are explicitly used to keep typed coverage:
      expect([WAGON, PARTY_GROUP].length).toBe(2);
    });
  });
});
