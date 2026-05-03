import { CompositeSpecification } from '@/filtering/shared/domain/specification';
import type { ItemSnapshot } from '@/filtering/items/domain/snapshot';

export class IdentifiedSpecification extends CompositeSpecification<ItemSnapshot> {
  constructor(private readonly expected: boolean) {
    super();
  }

  override isSatisfiedBy(item: ItemSnapshot): boolean {
    if (item.identified === null) {
      return false;
    }
    return item.identified === this.expected;
  }
}
