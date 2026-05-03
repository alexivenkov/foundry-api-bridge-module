import type { ItemSnapshot } from '@/filtering/items/domain/snapshot';
import type { FilterableRepository } from '@/filtering/shared/domain/repository';

import type { FoundryItemMapper } from './FoundryItemMapper';
import type { FoundryItemGameProvider } from './foundryGameProvider';

export class FoundryItemRepository implements FilterableRepository<ItemSnapshot> {
  constructor(
    private readonly gameProvider: FoundryItemGameProvider,
    private readonly mapper: FoundryItemMapper
  ) {}

  findAll(): Promise<readonly ItemSnapshot[]> {
    const items = this.gameProvider.getGame().items.contents;
    return Promise.resolve(items.map((i) => this.mapper.toSnapshot(i)));
  }
}
