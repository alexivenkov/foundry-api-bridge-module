import { CompositeSpecification } from '@/filtering/shared/domain/specification';
import type { EnumSet } from '@/filtering/shared/domain/value-objects';
import type { ItemSnapshot } from '@/filtering/items/domain/snapshot';
import type { SpellSchool } from '@/filtering/items/domain/value-objects';

export class SpellSchoolSpecification extends CompositeSpecification<ItemSnapshot> {
  constructor(private readonly schools: EnumSet<SpellSchool>) {
    super();
  }

  override isSatisfiedBy(item: ItemSnapshot): boolean {
    if (item.spellSchool === null) {
      return false;
    }
    return this.schools.has(item.spellSchool);
  }
}
