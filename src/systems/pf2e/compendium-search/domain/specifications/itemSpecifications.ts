import { CompositeSpecification } from '@/kernel';
import type { EnumSet, Range } from '@/kernel';
import type { Pf2eCompendiumItemSnapshot } from '@/systems/pf2e/compendium-search/domain/snapshot';

export class Pf2eCategoryInSpecification extends CompositeSpecification<Pf2eCompendiumItemSnapshot> {
  constructor(private readonly categories: EnumSet<string>) {
    super();
  }

  override isSatisfiedBy(item: Pf2eCompendiumItemSnapshot): boolean {
    if (item.category === null) {
      return false;
    }
    return this.categories.has(item.category);
  }
}

// ANY semantics: a spell belongs to several traditions; requesting "arcane"
// should match every spell castable on the arcane list.
export class Pf2eTraditionsAnySpecification extends CompositeSpecification<Pf2eCompendiumItemSnapshot> {
  constructor(private readonly traditions: EnumSet<string>) {
    super();
  }

  override isSatisfiedBy(item: Pf2eCompendiumItemSnapshot): boolean {
    return item.traditions.some(tradition => this.traditions.has(tradition));
  }
}

export class Pf2ePriceRangeSpecification extends CompositeSpecification<Pf2eCompendiumItemSnapshot> {
  constructor(private readonly range: Range) {
    super();
  }

  override isSatisfiedBy(item: Pf2eCompendiumItemSnapshot): boolean {
    if (item.priceGold === null) {
      return false;
    }
    return this.range.contains(item.priceGold);
  }
}
