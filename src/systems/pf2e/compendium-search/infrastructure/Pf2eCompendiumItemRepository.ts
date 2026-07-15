import type { FilterableRepository } from '@/kernel';
import type { Pf2eCompendiumItemSnapshot } from '@/systems/pf2e/compendium-search/domain';
import type { Pf2eCompendiumItemMapper } from './Pf2eCompendiumItemMapper';
import type { Pf2eCompendiumGameProvider } from './foundryCompendiumPackTypes';
import { resolvePacks } from './packResolution';

const ITEM_PACK_TYPE = 'Item';

export class Pf2eCompendiumItemRepository
  implements FilterableRepository<Pf2eCompendiumItemSnapshot>
{
  constructor(
    private readonly gameProvider: Pf2eCompendiumGameProvider,
    private readonly mapper: Pf2eCompendiumItemMapper,
    private readonly packIds?: readonly string[]
  ) {}

  async findAll(): Promise<readonly Pf2eCompendiumItemSnapshot[]> {
    const snapshots: Pf2eCompendiumItemSnapshot[] = [];
    for (const pack of resolvePacks(this.gameProvider, ITEM_PACK_TYPE, this.packIds)) {
      const documents = await pack.getDocuments();
      for (const doc of documents) {
        snapshots.push(this.mapper.toSnapshot(doc, pack.collection));
      }
    }
    return snapshots;
  }
}
