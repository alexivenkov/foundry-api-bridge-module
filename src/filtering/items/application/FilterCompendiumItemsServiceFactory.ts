import type { FilterableRepository } from '@/kernel';
import type { CompendiumItemSnapshot } from '@/filtering/items/domain/snapshot';

import { CompendiumItemSpecificationBuilder } from './CompendiumItemSpecificationBuilder';
import { FilterCompendiumItemsService } from './FilterCompendiumItemsService';

export interface FilterCompendiumItemsServiceDependencies {
  readonly repository: FilterableRepository<CompendiumItemSnapshot>;
}

export function createFilterCompendiumItemsService(
  deps: FilterCompendiumItemsServiceDependencies
): FilterCompendiumItemsService {
  return new FilterCompendiumItemsService(
    deps.repository,
    new CompendiumItemSpecificationBuilder()
  );
}
