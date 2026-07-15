import type { FilterableRepository, FolderResolver } from '@/kernel/domain/repository';
import type { ItemSnapshot } from '@/filtering/items/domain/snapshot';

import { ItemSpecificationBuilder } from './ItemSpecificationBuilder';
import { FilterItemsService } from './FilterItemsService';

export interface FilterItemsServiceDependencies {
  readonly repository: FilterableRepository<ItemSnapshot>;
  readonly folderResolver: FolderResolver;
}

export function createFilterItemsService(
  deps: FilterItemsServiceDependencies
): FilterItemsService {
  const builder = new ItemSpecificationBuilder(deps.folderResolver);
  return new FilterItemsService(deps.repository, builder);
}
