import type { FilterableRepository } from '@/kernel';
import type { Pf2eCompendiumActorSnapshot } from '@/systems/pf2e/compendium-search/domain';
import { Pf2eCompendiumActorSpecificationBuilder } from './Pf2eCompendiumActorSpecificationBuilder';
import type { Pf2eFilterCompendiumActorsQuery } from './queries';
import type { Pf2eCompendiumSearchResult } from './results';
import { runCompendiumSearch } from './searchExecution';

export class Pf2eFilterCompendiumActorsService {
  constructor(
    private readonly repository: FilterableRepository<Pf2eCompendiumActorSnapshot>,
    private readonly builder: Pf2eCompendiumActorSpecificationBuilder
  ) {}

  execute(query: Pf2eFilterCompendiumActorsQuery): Promise<Pf2eCompendiumSearchResult> {
    return runCompendiumSearch(this.repository, this.builder.build(query), query.pagination);
  }
}

export interface Pf2eFilterCompendiumActorsServiceDependencies {
  readonly repository: FilterableRepository<Pf2eCompendiumActorSnapshot>;
}

export function createPf2eFilterCompendiumActorsService(
  deps: Pf2eFilterCompendiumActorsServiceDependencies
): Pf2eFilterCompendiumActorsService {
  return new Pf2eFilterCompendiumActorsService(
    deps.repository,
    new Pf2eCompendiumActorSpecificationBuilder()
  );
}
