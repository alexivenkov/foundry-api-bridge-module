import { CompositeSpecification } from '@/kernel/domain/specification';
import type { ItemSnapshot } from '@/filtering/items/domain/snapshot';

export class IsContainerSpecification extends CompositeSpecification<ItemSnapshot> {
  constructor(private readonly expected: boolean) {
    super();
  }

  override isSatisfiedBy(item: ItemSnapshot): boolean {
    return item.isContainer === this.expected;
  }
}
