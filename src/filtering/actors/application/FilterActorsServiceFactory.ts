import type { FilterableRepository } from '@/kernel/domain/repository';
import type { ActorSnapshot } from '@/filtering/actors/domain/snapshot';

import {
  ActorSpecificationBuilder,
  type FolderResolver
} from './ActorSpecificationBuilder';
import { FilterActorsService } from './FilterActorsService';

export interface FilterActorsServiceDependencies {
  readonly repository: FilterableRepository<ActorSnapshot>;
  readonly folderResolver: FolderResolver;
}

export function createFilterActorsService(
  deps: FilterActorsServiceDependencies
): FilterActorsService {
  const builder = new ActorSpecificationBuilder(deps.folderResolver);
  return new FilterActorsService(deps.repository, builder);
}
