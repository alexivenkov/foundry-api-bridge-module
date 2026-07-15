import { executeFilterQuery } from '@/kernel/application';
import type { FilterableRepository } from '@/kernel/domain/repository';
import type { ItemSnapshot } from '@/filtering/items/domain/snapshot';

import { ItemSpecificationBuilder } from './ItemSpecificationBuilder';
import type { FilterItemsQuery } from './FilterItemsQuery';
import type {
  FilterItemsResult,
  FilterItemsResultEntry
} from './FilterItemsResult';

export class FilterItemsService {
  constructor(
    private readonly repository: FilterableRepository<ItemSnapshot>,
    private readonly builder: ItemSpecificationBuilder
  ) {}

  async execute(query: FilterItemsQuery): Promise<FilterItemsResult> {
    const specification = this.builder.build(query);
    const queryResult = await executeFilterQuery({
      repository: this.repository,
      specification,
      comparator: this.compareByNameThenId,
      pagination: query.pagination
    });

    const results: FilterItemsResultEntry[] = queryResult.items.map((item) => ({
      id: item.id,
      name: item.name
    }));

    return {
      results,
      total: queryResult.total,
      hasMore: queryResult.hasMore
    };
  }

  private readonly compareByNameThenId = (
    a: ItemSnapshot,
    b: ItemSnapshot
  ): number => {
    const nameCompare = a.name.localeCompare(b.name);
    if (nameCompare !== 0) {
      return nameCompare;
    }
    return a.id.localeCompare(b.id);
  };
}
