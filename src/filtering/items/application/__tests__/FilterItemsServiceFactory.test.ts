import { PaginationParams } from '@/kernel/domain/value-objects';
import { FolderReference } from '@/kernel/domain/value-objects';
import type {
  FilterableRepository,
  FolderResolver
} from '@/kernel/domain/repository';
import type { ItemSnapshot } from '@/filtering/items/domain/snapshot';
import {
  ALL_FIXTURES,
  FIREBALL,
  CANTRIP_LIGHT
} from '@/filtering/items/domain/__tests__/fixtures/itemSnapshots';

import { FilterItemsService } from '../FilterItemsService';
import { createFilterItemsService } from '../FilterItemsServiceFactory';
import type { FilterItemsQuery } from '../FilterItemsQuery';

const makeRepository = (
  items: readonly ItemSnapshot[]
): FilterableRepository<ItemSnapshot> & { findAll: jest.Mock } => ({
  findAll: jest.fn().mockResolvedValue(items)
});

const makeFolderResolver = (
  ids: readonly string[] = []
): FolderResolver & { resolve: jest.Mock } => ({
  resolve: jest.fn().mockReturnValue(new Set<string>(ids))
});

const baseQuery = (overrides: Partial<FilterItemsQuery> = {}): FilterItemsQuery => ({
  pagination: PaginationParams.default(),
  ...overrides
});

describe('createFilterItemsService', () => {
  it('returns a FilterItemsService instance', () => {
    const repository = makeRepository([]);
    const folderResolver = makeFolderResolver();

    const service = createFilterItemsService({ repository, folderResolver });

    expect(service).toBeInstanceOf(FilterItemsService);
  });

  it('produces a service that uses the supplied repository (findAll is called)', async () => {
    const repository = makeRepository(ALL_FIXTURES);
    const folderResolver = makeFolderResolver();

    const service = createFilterItemsService({ repository, folderResolver });
    const result = await service.execute(baseQuery());

    expect(repository.findAll).toHaveBeenCalledTimes(1);
    expect(result.total).toBe(ALL_FIXTURES.length);
  });

  it('produces a service that uses the supplied folderResolver when query.folder is set', async () => {
    const repository = makeRepository(ALL_FIXTURES);
    const folderResolver = makeFolderResolver(['folder-spells']);
    const folderRef = new FolderReference('folder-spells', undefined, false);

    const service = createFilterItemsService({ repository, folderResolver });
    const result = await service.execute(baseQuery({ folder: folderRef }));

    expect(folderResolver.resolve).toHaveBeenCalledTimes(1);
    expect(folderResolver.resolve).toHaveBeenCalledWith(folderRef);
    expect(result.results.map((r) => r.id).sort()).toEqual(
      [FIREBALL.id, CANTRIP_LIGHT.id].sort()
    );
    expect(result.total).toBe(2);
  });

  it('does not call folderResolver when query.folder is absent', async () => {
    const repository = makeRepository(ALL_FIXTURES);
    const folderResolver = makeFolderResolver();

    const service = createFilterItemsService({ repository, folderResolver });
    await service.execute(baseQuery());

    expect(folderResolver.resolve).not.toHaveBeenCalled();
  });

  it('two factory calls produce independent service instances', () => {
    const repository = makeRepository([]);
    const folderResolver = makeFolderResolver();

    const a = createFilterItemsService({ repository, folderResolver });
    const b = createFilterItemsService({ repository, folderResolver });

    expect(a).not.toBe(b);
    expect(a).toBeInstanceOf(FilterItemsService);
    expect(b).toBeInstanceOf(FilterItemsService);
  });
});
