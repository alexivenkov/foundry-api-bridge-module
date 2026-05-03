import { CompositeSpecification } from '@/filtering/shared/domain/specification';
import type { ItemSnapshot } from '@/filtering/items/domain/snapshot';

export class RequiresAttunementSpecification extends CompositeSpecification<ItemSnapshot> {
  constructor(private readonly expected: boolean) {
    super();
  }

  override isSatisfiedBy(item: ItemSnapshot): boolean {
    if (item.requiresAttunement === null) {
      return false;
    }
    return item.requiresAttunement === this.expected;
  }
}
