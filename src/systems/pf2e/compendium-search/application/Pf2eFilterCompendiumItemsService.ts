import type { FilterableRepository } from '@/kernel';
import type { Pf2eCompendiumItemSnapshot } from '@/systems/pf2e/compendium-search/domain';
import { Pf2eCompendiumItemSpecificationBuilder } from './Pf2eCompendiumItemSpecificationBuilder';
import type { Pf2eFilterCompendiumItemsQuery } from './queries';
import type { Pf2eCompendiumSearchResult } from './results';
import { runCompendiumSearch } from './searchExecution';

export class Pf2eFilterCompendiumItemsService {
  constructor(
    private readonly repository: FilterableRepository<Pf2eCompendiumItemSnapshot>,
    private readonly builder: Pf2eCompendiumItemSpecificationBuilder
  ) {}

  execute(query: Pf2eFilterCompendiumItemsQuery): Promise<Pf2eCompendiumSearchResult> {
    return runCompendiumSearch(this.repository, this.builder.build(query), query.pagination);
  }
}

export interface Pf2eFilterCompendiumItemsServiceDependencies {
  readonly repository: FilterableRepository<Pf2eCompendiumItemSnapshot>;
}

export function createPf2eFilterCompendiumItemsService(
  deps: Pf2eFilterCompendiumItemsServiceDependencies
): Pf2eFilterCompendiumItemsService {
  return new Pf2eFilterCompendiumItemsService(
    deps.repository,
    new Pf2eCompendiumItemSpecificationBuilder()
  );
}
