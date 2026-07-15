import { CompositeSpecification } from '@/kernel/domain/specification';
import type { EnumSet } from '@/kernel/domain/value-objects';
import type { ItemSnapshot } from '@/filtering/items/domain/snapshot';
import type { ItemRarity } from '@/filtering/items/domain/value-objects';

export class ItemRaritySpecification extends CompositeSpecification<ItemSnapshot> {
  constructor(private readonly rarities: EnumSet<ItemRarity>) {
    super();
  }

  override isSatisfiedBy(item: ItemSnapshot): boolean {
    if (item.rarity === null) {
      return false;
    }
    return this.rarities.has(item.rarity);
  }
}
