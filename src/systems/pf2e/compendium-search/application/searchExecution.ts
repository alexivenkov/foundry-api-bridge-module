import { executeFilterQuery } from '@/kernel';
import type { FilterableRepository, ISpecification, PaginationParams } from '@/kernel';
import type { Pf2eSearchableDocument } from '@/systems/pf2e/compendium-search/domain';
import type { Pf2eCompendiumSearchResult } from './results';

export function compareByLevelThenName(
  a: Pf2eSearchableDocument,
  b: Pf2eSearchableDocument
): number {
  const levelA = a.level ?? Number.POSITIVE_INFINITY;
  const levelB = b.level ?? Number.POSITIVE_INFINITY;
  if (levelA !== levelB) {
    return levelA - levelB;
  }
  const nameCompare = a.name.localeCompare(b.name);
  if (nameCompare !== 0) {
    return nameCompare;
  }
  return a.id.localeCompare(b.id);
}

export async function runCompendiumSearch<T extends Pf2eSearchableDocument>(
  repository: FilterableRepository<T>,
  specification: ISpecification<T>,
  pagination: PaginationParams
): Promise<Pf2eCompendiumSearchResult> {
  const queryResult = await executeFilterQuery({
    repository,
    specification,
    comparator: compareByLevelThenName,
    pagination
  });

  return {
    results: queryResult.items.map(snapshot => ({
      id: snapshot.id,
      name: snapshot.name,
      level: snapshot.level,
      packId: snapshot.packId,
      uuid: snapshot.uuid
    })),
    total: queryResult.total,
    hasMore: queryResult.hasMore
  };
}
