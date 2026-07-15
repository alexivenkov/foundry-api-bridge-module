import type { FilterableRepository } from '@/kernel';
import type { Pf2eCompendiumActorSnapshot } from '@/systems/pf2e/compendium-search/domain';
import type { Pf2eCompendiumActorMapper } from './Pf2eCompendiumActorMapper';
import type { Pf2eCompendiumGameProvider } from './foundryCompendiumPackTypes';
import { resolvePacks } from './packResolution';

const ACTOR_PACK_TYPE = 'Actor';

export class Pf2eCompendiumActorRepository
  implements FilterableRepository<Pf2eCompendiumActorSnapshot>
{
  constructor(
    private readonly gameProvider: Pf2eCompendiumGameProvider,
    private readonly mapper: Pf2eCompendiumActorMapper,
    private readonly packIds?: readonly string[]
  ) {}

  async findAll(): Promise<readonly Pf2eCompendiumActorSnapshot[]> {
    const snapshots: Pf2eCompendiumActorSnapshot[] = [];
    for (const pack of resolvePacks(this.gameProvider, ACTOR_PACK_TYPE, this.packIds)) {
      const documents = await pack.getDocuments();
      for (const doc of documents) {
        snapshots.push(this.mapper.toSnapshot(doc, pack.collection));
      }
    }
    return snapshots;
  }
}
