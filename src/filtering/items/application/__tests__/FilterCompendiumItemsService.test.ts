import { PaginationParams, SubstringQuery } from '@/kernel';
import type { FilterableRepository } from '@/kernel';
import { ItemType } from '@/filtering/items/domain/value-objects';
import type { CompendiumItemSnapshot } from '@/filtering/items/domain/snapshot';
import { CompendiumItemSpecificationBuilder } from '../CompendiumItemSpecificationBuilder';
import { FilterCompendiumItemsService } from '../FilterCompendiumItemsService';

function makeSnapshot(
  id: string,
  name: string,
  packId = 'dnd5e.items'
): CompendiumItemSnapshot {
  return {
    id,
    name,
    type: ItemType.Weapon,
    folderId: null,
    rarity: null,
    identified: null,
    requiresAttunement: null,
    weight: null,
    priceGp: null,
    spellLevel: null,
    spellSchool: null,
    hasActivities: false,
    isContainer: false,
    packId,
    uuid: `Compendium.${packId}.Item.${id}`
  };
}

function makeService(
  snapshots: readonly CompendiumItemSnapshot[]
): FilterCompendiumItemsService {
  const repo: FilterableRepository<CompendiumItemSnapshot> = {
    findAll: () => Promise.resolve(snapshots)
  };
  return new FilterCompendiumItemsService(repo, new CompendiumItemSpecificationBuilder());
}

describe('FilterCompendiumItemsService', () => {
  it('returns entries enriched with packId and uuid, sorted by name then id', async () => {
    const service = makeService([
      makeSnapshot('b', 'Longsword'),
      makeSnapshot('a', 'Dagger', 'world.custom')
    ]);

    const result = await service.execute({ pagination: PaginationParams.default() });

    expect(result.results).toEqual([
      {
        id: 'a',
        name: 'Dagger',
        packId: 'world.custom',
        uuid: 'Compendium.world.custom.Item.a'
      },
      {
        id: 'b',
        name: 'Longsword',
        packId: 'dnd5e.items',
        uuid: 'Compendium.dnd5e.items.Item.b'
      }
    ]);
    expect(result.total).toBe(2);
  });

  it('breaks name ties by id', async () => {
    const service = makeService([
      makeSnapshot('b', 'Dagger'),
      makeSnapshot('a', 'Dagger')
    ]);

    const result = await service.execute({ pagination: PaginationParams.default() });
    expect(result.results.map(r => r.id)).toEqual(['a', 'b']);
  });

  it('filters and paginates', async () => {
    const service = makeService([
      makeSnapshot('a', 'Dagger'),
      makeSnapshot('b', 'Dagger of Venom'),
      makeSnapshot('c', 'Mace')
    ]);

    const result = await service.execute({
      name: new SubstringQuery('dagger'),
      pagination: new PaginationParams(1, 0)
    });

    expect(result.total).toBe(2);
    expect(result.results.map(r => r.id)).toEqual(['a']);
    expect(result.hasMore).toBe(true);
  });
});
