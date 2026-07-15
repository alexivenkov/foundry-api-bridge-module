import { PaginationParams, SubstringQuery } from '@/kernel';
import type { FilterableRepository } from '@/kernel';
import { ActorType } from '@/filtering/actors/domain/value-objects';
import type { CompendiumActorSnapshot } from '@/filtering/actors/domain/snapshot';
import { CompendiumActorSpecificationBuilder } from '../CompendiumActorSpecificationBuilder';
import { FilterCompendiumActorsService } from '../FilterCompendiumActorsService';

function makeSnapshot(
  id: string,
  name: string,
  packId = 'dnd5e.monsters'
): CompendiumActorSnapshot {
  return {
    id,
    name,
    type: ActorType.Npc,
    hasPlayerOwner: false,
    folderId: null,
    creatureType: null,
    size: null,
    disposition: null,
    cr: null,
    level: null,
    hp: null,
    ac: null,
    abilities: null,
    packId,
    uuid: `Compendium.${packId}.Actor.${id}`
  };
}

function makeRepo(
  snapshots: readonly CompendiumActorSnapshot[]
): FilterableRepository<CompendiumActorSnapshot> {
  return { findAll: () => Promise.resolve(snapshots) };
}

function makeService(
  snapshots: readonly CompendiumActorSnapshot[]
): FilterCompendiumActorsService {
  return new FilterCompendiumActorsService(
    makeRepo(snapshots),
    new CompendiumActorSpecificationBuilder()
  );
}

describe('FilterCompendiumActorsService', () => {
  it('returns entries enriched with packId and uuid, sorted by name then id', async () => {
    const service = makeService([
      makeSnapshot('b', 'Orc'),
      makeSnapshot('z', 'Goblin', 'world.custom'),
      makeSnapshot('a', 'Goblin')
    ]);

    const result = await service.execute({ pagination: PaginationParams.default() });

    expect(result.results).toEqual([
      {
        id: 'a',
        name: 'Goblin',
        packId: 'dnd5e.monsters',
        uuid: 'Compendium.dnd5e.monsters.Actor.a'
      },
      {
        id: 'z',
        name: 'Goblin',
        packId: 'world.custom',
        uuid: 'Compendium.world.custom.Actor.z'
      },
      {
        id: 'b',
        name: 'Orc',
        packId: 'dnd5e.monsters',
        uuid: 'Compendium.dnd5e.monsters.Actor.b'
      }
    ]);
    expect(result.total).toBe(3);
    expect(result.hasMore).toBe(false);
  });

  it('applies specifications before pagination', async () => {
    const service = makeService([
      makeSnapshot('a', 'Goblin'),
      makeSnapshot('b', 'Hobgoblin'),
      makeSnapshot('c', 'Orc')
    ]);

    const result = await service.execute({
      name: new SubstringQuery('gob'),
      pagination: new PaginationParams(1, 1)
    });

    expect(result.total).toBe(2);
    expect(result.results.map(r => r.name)).toEqual(['Hobgoblin']);
    expect(result.hasMore).toBe(false);
  });

  it('reports hasMore when a page cuts the result set', async () => {
    const service = makeService(
      Array.from({ length: 5 }, (_v, i) => makeSnapshot(`id${String(i)}`, `Actor ${String(i)}`))
    );

    const result = await service.execute({ pagination: new PaginationParams(2, 0) });
    expect(result.results).toHaveLength(2);
    expect(result.hasMore).toBe(true);
  });

  it('returns empty result for empty repository', async () => {
    const result = await makeService([]).execute({
      pagination: PaginationParams.default()
    });
    expect(result).toEqual({ results: [], total: 0, hasMore: false });
  });
});
