import { executeFilterQuery } from '@/kernel';
import type { FilterableRepository } from '@/kernel';
import type { CompendiumActorSnapshot } from '@/filtering/actors/domain/snapshot';

import { CompendiumActorSpecificationBuilder } from './CompendiumActorSpecificationBuilder';
import type { FilterCompendiumActorsQuery } from './FilterCompendiumActorsQuery';
import type {
  FilterCompendiumActorsResult,
  FilterCompendiumActorsResultEntry
} from './FilterCompendiumActorsResult';

export class FilterCompendiumActorsService {
  constructor(
    private readonly repository: FilterableRepository<CompendiumActorSnapshot>,
    private readonly builder: CompendiumActorSpecificationBuilder
  ) {}

  async execute(query: FilterCompendiumActorsQuery): Promise<FilterCompendiumActorsResult> {
    const specification = this.builder.build(query);
    const queryResult = await executeFilterQuery({
      repository: this.repository,
      specification,
      comparator: this.compareByNameThenId,
      pagination: query.pagination
    });

    const results: FilterCompendiumActorsResultEntry[] = queryResult.items.map(actor => ({
      id: actor.id,
      name: actor.name,
      packId: actor.packId,
      uuid: actor.uuid
    }));

    return {
      results,
      total: queryResult.total,
      hasMore: queryResult.hasMore
    };
  }

  private readonly compareByNameThenId = (
    a: CompendiumActorSnapshot,
    b: CompendiumActorSnapshot
  ): number => {
    const nameCompare = a.name.localeCompare(b.name);
    if (nameCompare !== 0) {
      return nameCompare;
    }
    return a.id.localeCompare(b.id);
  };
}
