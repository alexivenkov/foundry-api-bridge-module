import { executeFilterQuery } from '@/kernel';
import type { FilterableRepository } from '@/kernel';
import type { CompendiumItemSnapshot } from '@/filtering/items/domain/snapshot';

import { CompendiumItemSpecificationBuilder } from './CompendiumItemSpecificationBuilder';
import type { FilterCompendiumItemsQuery } from './FilterCompendiumItemsQuery';
import type {
  FilterCompendiumItemsResult,
  FilterCompendiumItemsResultEntry
} from './FilterCompendiumItemsResult';

export class FilterCompendiumItemsService {
  constructor(
    private readonly repository: FilterableRepository<CompendiumItemSnapshot>,
    private readonly builder: CompendiumItemSpecificationBuilder
  ) {}

  async execute(query: FilterCompendiumItemsQuery): Promise<FilterCompendiumItemsResult> {
    const specification = this.builder.build(query);
    const queryResult = await executeFilterQuery({
      repository: this.repository,
      specification,
      comparator: this.compareByNameThenId,
      pagination: query.pagination
    });

    const results: FilterCompendiumItemsResultEntry[] = queryResult.items.map(item => ({
      id: item.id,
      name: item.name,
      packId: item.packId,
      uuid: item.uuid
    }));

    return {
      results,
      total: queryResult.total,
      hasMore: queryResult.hasMore
    };
  }

  private readonly compareByNameThenId = (
    a: CompendiumItemSnapshot,
    b: CompendiumItemSnapshot
  ): number => {
    const nameCompare = a.name.localeCompare(b.name);
    if (nameCompare !== 0) {
      return nameCompare;
    }
    return a.id.localeCompare(b.id);
  };
}
