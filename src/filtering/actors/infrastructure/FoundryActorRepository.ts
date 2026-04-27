import type { ActorSnapshot } from '@/filtering/actors/domain/snapshot';
import type { FilterableRepository } from '@/filtering/shared/domain/repository';

import type { FoundryActorMapper } from './FoundryActorMapper';
import type { FoundryGameProvider } from './foundryGameProvider';

export class FoundryActorRepository implements FilterableRepository<ActorSnapshot> {
  constructor(
    private readonly gameProvider: FoundryGameProvider,
    private readonly mapper: FoundryActorMapper
  ) {}

  findAll(): Promise<readonly ActorSnapshot[]> {
    const actors = this.gameProvider.getGame().actors.contents;
    return Promise.resolve(actors.map((a) => this.mapper.toSnapshot(a)));
  }
}
