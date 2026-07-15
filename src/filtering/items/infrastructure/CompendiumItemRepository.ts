import type { FilterableRepository } from '@/kernel';
import type { CompendiumItemSnapshot } from '@/filtering/items/domain/snapshot';

import { CompendiumPackNotFoundError, CompendiumPackTypeError } from './compendiumErrors';
import type { FoundryItemMapper } from './FoundryItemMapper';
import type {
  CompendiumItemFilteringGameProvider,
  FoundryItemCompendiumPack
} from './foundryCompendiumPackTypes';

const ITEM_PACK_TYPE = 'Item';

export class CompendiumItemRepository
  implements FilterableRepository<CompendiumItemSnapshot>
{
  constructor(
    private readonly gameProvider: CompendiumItemFilteringGameProvider,
    private readonly mapper: FoundryItemMapper,
    private readonly packIds?: readonly string[]
  ) {}

  async findAll(): Promise<readonly CompendiumItemSnapshot[]> {
    const snapshots: CompendiumItemSnapshot[] = [];
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
  // omitted packIds discover every Item pack of the world.
  private resolvePacks(): FoundryItemCompendiumPack[] {
    const packs = this.gameProvider.getGame().packs;

    if (this.packIds !== undefined) {
      return this.packIds.map(packId => {
        const pack = packs?.get(packId);
        if (!pack) {
          throw new CompendiumPackNotFoundError(packId);
        }
        if (pack.metadata.type !== ITEM_PACK_TYPE) {
          throw new CompendiumPackTypeError(packId, ITEM_PACK_TYPE);
        }
        return pack;
      });
    }

    const discovered: FoundryItemCompendiumPack[] = [];
    packs?.forEach(pack => {
      if (pack.metadata.type === ITEM_PACK_TYPE) {
        discovered.push(pack);
      }
    });
    return discovered;
  }
}
