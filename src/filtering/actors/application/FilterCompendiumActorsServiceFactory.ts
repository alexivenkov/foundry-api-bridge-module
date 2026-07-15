import type { FilterableRepository } from '@/kernel';
import type { CompendiumActorSnapshot } from '@/filtering/actors/domain/snapshot';

import { CompendiumActorSpecificationBuilder } from './CompendiumActorSpecificationBuilder';
import { FilterCompendiumActorsService } from './FilterCompendiumActorsService';

export interface FilterCompendiumActorsServiceDependencies {
  readonly repository: FilterableRepository<CompendiumActorSnapshot>;
}

export function createFilterCompendiumActorsService(
  deps: FilterCompendiumActorsServiceDependencies
): FilterCompendiumActorsService {
  return new FilterCompendiumActorsService(
    deps.repository,
    new CompendiumActorSpecificationBuilder()
  );
}
