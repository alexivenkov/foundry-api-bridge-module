import { executeFilterQuery } from '@/kernel/application';
import type { FilterableRepository } from '@/kernel/domain/repository';
import type { ActorSnapshot } from '@/filtering/actors/domain/snapshot';

import { ActorSpecificationBuilder } from './ActorSpecificationBuilder';
import type { FilterActorsQuery } from './FilterActorsQuery';
import type {
  FilterActorsResult,
  FilterActorsResultEntry
} from './FilterActorsResult';

export class FilterActorsService {
  constructor(
    private readonly repository: FilterableRepository<ActorSnapshot>,
    private readonly builder: ActorSpecificationBuilder
  ) {}

  async execute(query: FilterActorsQuery): Promise<FilterActorsResult> {
    const specification = this.builder.build(query);
    const queryResult = await executeFilterQuery({
      repository: this.repository,
      specification,
      comparator: this.compareByNameThenId,
      pagination: query.pagination
    });

    const results: FilterActorsResultEntry[] = queryResult.items.map((actor) => ({
      id: actor.id,
      name: actor.name
    }));

    return {
      results,
      total: queryResult.total,
      hasMore: queryResult.hasMore
    };
  }

  private readonly compareByNameThenId = (a: ActorSnapshot, b: ActorSnapshot): number => {
    const nameCompare = a.name.localeCompare(b.name);
    if (nameCompare !== 0) {
      return nameCompare;
    }
    return a.id.localeCompare(b.id);
  };
}
