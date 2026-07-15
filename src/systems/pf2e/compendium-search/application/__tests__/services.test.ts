import { PaginationParams } from '@/kernel';
import type { FilterableRepository } from '@/kernel';
import { makeActorSnapshot } from '../../domain/__tests__/fixtures';
import type { Pf2eCompendiumActorSnapshot } from '../../domain';
import { createPf2eFilterCompendiumActorsService } from '../Pf2eFilterCompendiumActorsService';

function makeService(
  snapshots: readonly Pf2eCompendiumActorSnapshot[]
): ReturnType<typeof createPf2eFilterCompendiumActorsService> {
  const repository: FilterableRepository<Pf2eCompendiumActorSnapshot> = {
    findAll: () => Promise.resolve(snapshots)
  };
  return createPf2eFilterCompendiumActorsService({ repository });
}

describe('Pf2eFilterCompendiumActorsService', () => {
  it('sorts by level, then name, then id; null levels sink to the end', async () => {
    const service = makeService([
      makeActorSnapshot({ id: 'c', name: 'Ogre', level: 3 }),
      makeActorSnapshot({ id: 'b', name: 'Zombie', level: 1 }),
      makeActorSnapshot({ id: 'a', name: 'Skeleton', level: 1 }),
      makeActorSnapshot({ id: 'd', name: 'Statue', level: null })
    ]);

    const result = await service.execute({ pagination: PaginationParams.default() });

    expect(result.results.map(r => r.id)).toEqual(['a', 'b', 'c', 'd']);
    expect(result.results[0]).toEqual({
      id: 'a',
      name: 'Skeleton',
      level: 1,
      packId: 'pf2e.pathfinder-monster-core',
      uuid: 'Compendium.pf2e.pathfinder-monster-core.Actor.m1'
    });
  });

  it('paginates after filtering and reports hasMore', async () => {
    const service = makeService(
      Array.from({ length: 5 }, (_v, i) =>
        makeActorSnapshot({ id: `m${String(i)}`, name: `Monster ${String(i)}`, level: i })
      )
    );

    const result = await service.execute({ pagination: new PaginationParams(2, 2) });

    expect(result.total).toBe(5);
    expect(result.results.map(r => r.level)).toEqual([2, 3]);
    expect(result.hasMore).toBe(true);
  });

  it('sorts entries with null levels among themselves by name', async () => {
    const service = makeService([
      makeActorSnapshot({ id: 'b', name: 'Wagon', level: null }),
      makeActorSnapshot({ id: 'a', name: 'Altar', level: null })
    ]);

    const result = await service.execute({ pagination: PaginationParams.default() });
    expect(result.results.map(r => r.name)).toEqual(['Altar', 'Wagon']);
  });

  it('breaks equal-level ties by name then id', async () => {
    const service = makeService([
      makeActorSnapshot({ id: 'b', name: 'Goblin', level: 1 }),
      makeActorSnapshot({ id: 'a', name: 'Goblin', level: 1 })
    ]);

    const result = await service.execute({ pagination: PaginationParams.default() });
    expect(result.results.map(r => r.id)).toEqual(['a', 'b']);
  });
});
