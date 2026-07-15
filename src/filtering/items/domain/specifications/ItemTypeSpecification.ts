import { CompositeSpecification } from '@/kernel/domain/specification';
import type { EnumSet } from '@/kernel/domain/value-objects';
import type { ItemSnapshot } from '@/filtering/items/domain/snapshot';
import type { ItemType } from '@/filtering/items/domain/value-objects';

export class ItemTypeSpecification extends CompositeSpecification<ItemSnapshot> {
  constructor(private readonly types: EnumSet<ItemType>) {
    super();
  }

  override isSatisfiedBy(item: ItemSnapshot): boolean {
    return this.types.has(item.type);
  }
}
