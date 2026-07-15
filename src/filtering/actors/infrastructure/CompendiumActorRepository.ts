import type { FilterableRepository } from '@/kernel';
import type { CompendiumActorSnapshot } from '@/filtering/actors/domain/snapshot';

import { CompendiumPackNotFoundError, CompendiumPackTypeError } from './compendiumErrors';
import type { FoundryActorMapper } from './FoundryActorMapper';
import type {
  CompendiumFilteringGameProvider,
  FoundryActorCompendiumPack
} from './foundryCompendiumPackTypes';

const ACTOR_PACK_TYPE = 'Actor';

export class CompendiumActorRepository
  implements FilterableRepository<CompendiumActorSnapshot>
{
  constructor(
    private readonly gameProvider: CompendiumFilteringGameProvider,
    private readonly mapper: FoundryActorMapper,
    private readonly packIds?: readonly string[]
  ) {}

  async findAll(): Promise<readonly CompendiumActorSnapshot[]> {
    const snapshots: CompendiumActorSnapshot[] = [];
    for (const pack of this.resolvePacks()) {
      const documents = await pack.getDocuments();
      for (const doc of documents) {
        snapshots.push({
          ...this.mapper.toSnapshot(doc),
          packId: pack.collection,
          uuid: doc.uuid
        });
      }
    }
    return snapshots;
  }

  // Explicit packIds resolve loudly (unknown pack / wrong pack type throw);
  // omitted packIds discover every Actor pack of the world.
  private resolvePacks(): FoundryActorCompendiumPack[] {
    const packs = this.gameProvider.getGame().packs;

    if (this.packIds !== undefined) {
      return this.packIds.map(packId => {
        const pack = packs?.get(packId);
        if (!pack) {
          throw new CompendiumPackNotFoundError(packId);
        }
        if (pack.metadata.type !== ACTOR_PACK_TYPE) {
          throw new CompendiumPackTypeError(packId, ACTOR_PACK_TYPE);
        }
        return pack;
      });
    }

    const discovered: FoundryActorCompendiumPack[] = [];
    packs?.forEach(pack => {
      if (pack.metadata.type === ACTOR_PACK_TYPE) {
        discovered.push(pack);
      }
    });
    return discovered;
  }
}
