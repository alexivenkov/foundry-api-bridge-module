import { PaginationParams } from '@/filtering/shared/domain/value-objects';
import type { FilterableRepository } from '@/filtering/shared/domain/repository';
import { FolderReference } from '@/filtering/actors/domain/value-objects';
import type { ActorSnapshot } from '@/filtering/actors/domain/snapshot';
import {
  ALL_FIXTURES,
  FRODO,
  GANDALF
} from '@/filtering/actors/domain/__tests__/fixtures/actorSnapshots';

import type { FolderResolver } from '../ActorSpecificationBuilder';
import { FilterActorsService } from '../FilterActorsService';
import { createFilterActorsService } from '../FilterActorsServiceFactory';
import type { FilterActorsQuery } from '../FilterActorsQuery';

const makeRepository = (
  items: readonly ActorSnapshot[]
): FilterableRepository<ActorSnapshot> & { findAll: jest.Mock } => ({
  findAll: jest.fn().mockResolvedValue(items)
});

const makeFolderResolver = (
  ids: readonly string[] = []
): FolderResolver & { resolve: jest.Mock } => ({
  resolve: jest.fn().mockReturnValue(new Set<string>(ids))
});

const baseQuery = (overrides: Partial<FilterActorsQuery> = {}): FilterActorsQuery => ({
  pagination: PaginationParams.default(),
  ...overrides
});

describe('createFilterActorsService', () => {
  it('returns a FilterActorsService instance', () => {
    const repository = makeRepository([]);
    const folderResolver = makeFolderResolver();

    const service = createFilterActorsService({ repository, folderResolver });

    expect(service).toBeInstanceOf(FilterActorsService);
  });

  it('produces a service that uses the supplied repository (findAll is called)', async () => {
    const repository = makeRepository(ALL_FIXTURES);
    const folderResolver = makeFolderResolver();

    const service = createFilterActorsService({ repository, folderResolver });
    const result = await service.execute(baseQuery());

    expect(repository.findAll).toHaveBeenCalledTimes(1);
    expect(result.total).toBe(ALL_FIXTURES.length);
  });

  it('produces a service that uses the supplied folderResolver when query.folder is set', async () => {
    const repository = makeRepository(ALL_FIXTURES);
    const folderResolver = makeFolderResolver(['folder-pcs']);
    const folderRef = new FolderReference('folder-pcs', undefined, false);

    const service = createFilterActorsService({ repository, folderResolver });
    const result = await service.execute(baseQuery({ folder: folderRef }));

    expect(folderResolver.resolve).toHaveBeenCalledTimes(1);
    expect(folderResolver.resolve).toHaveBeenCalledWith(folderRef);
    expect(result.results.map((r) => r.id).sort()).toEqual([FRODO.id, GANDALF.id].sort());
    expect(result.total).toBe(2);
  });

  it('does not call folderResolver when query.folder is absent', async () => {
    const repository = makeRepository(ALL_FIXTURES);
    const folderResolver = makeFolderResolver();

    const service = createFilterActorsService({ repository, folderResolver });
    await service.execute(baseQuery());

    expect(folderResolver.resolve).not.toHaveBeenCalled();
  });

  it('two factory calls produce independent service instances', () => {
    const repository = makeRepository([]);
    const folderResolver = makeFolderResolver();

    const a = createFilterActorsService({ repository, folderResolver });
    const b = createFilterActorsService({ repository, folderResolver });

    expect(a).not.toBe(b);
    expect(a).toBeInstanceOf(FilterActorsService);
    expect(b).toBeInstanceOf(FilterActorsService);
  });
});
