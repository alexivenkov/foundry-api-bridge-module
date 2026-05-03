import { CompositeSpecification } from '@/filtering/shared/domain/specification';
import type { Range } from '@/filtering/shared/domain/value-objects';
import type { ItemSnapshot } from '@/filtering/items/domain/snapshot';

export class SpellLevelRangeSpecification extends CompositeSpecification<ItemSnapshot> {
  constructor(private readonly range: Range) {
    super();
  }

  override isSatisfiedBy(item: ItemSnapshot): boolean {
    if (item.spellLevel === null) {
      return false;
    }
    return this.range.contains(item.spellLevel);
  }
}
