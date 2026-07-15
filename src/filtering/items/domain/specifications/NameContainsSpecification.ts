import { CompositeSpecification } from '@/kernel/domain/specification';
import type { SubstringQuery } from '@/kernel/domain/value-objects';
import type { ItemSnapshot } from '@/filtering/items/domain/snapshot';

export class NameContainsSpecification extends CompositeSpecification<ItemSnapshot> {
  constructor(private readonly query: SubstringQuery) {
    super();
  }

  override isSatisfiedBy(item: ItemSnapshot): boolean {
    return this.query.matches(item.name);
  }
}
