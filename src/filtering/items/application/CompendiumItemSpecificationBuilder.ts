import { SpecificationBuilder, type SpecificationFactory } from '@/kernel';
import type { ISpecification } from '@/kernel';
import type { CompendiumItemSnapshot } from '@/filtering/items/domain/snapshot';
import {
  HasActivitiesSpecification,
  IdentifiedSpecification,
  IsContainerSpecification,
  ItemRaritySpecification,
  ItemTypeSpecification,
  NameContainsSpecification,
  PriceRangeSpecification,
  RequiresAttunementSpecification,
  SpellLevelRangeSpecification,
  SpellSchoolSpecification,
  WeightRangeSpecification
} from '@/filtering/items/domain/specifications';

import type { FilterCompendiumItemsQuery } from './FilterCompendiumItemsQuery';

type CompendiumItemSpecFactory = SpecificationFactory<
  FilterCompendiumItemsQuery,
  CompendiumItemSnapshot
>;

// Reuses the world-filtering specification classes verbatim — they are typed
// against ItemSnapshot, which CompendiumItemSnapshot extends.
const COMPENDIUM_ITEM_SPEC_FACTORIES: readonly CompendiumItemSpecFactory[] = [
  (q): ISpecification<CompendiumItemSnapshot> | null =>
    q.name !== undefined ? new NameContainsSpecification(q.name) : null,
  (q): ISpecification<CompendiumItemSnapshot> | null =>
    q.types !== undefined ? new ItemTypeSpecification(q.types) : null,
  (q): ISpecification<CompendiumItemSnapshot> | null =>
    q.rarities !== undefined ? new ItemRaritySpecification(q.rarities) : null,
  (q): ISpecification<CompendiumItemSnapshot> | null =>
    q.spellSchools !== undefined ? new SpellSchoolSpecification(q.spellSchools) : null,
  (q): ISpecification<CompendiumItemSnapshot> | null =>
    q.requiresAttunement !== undefined
      ? new RequiresAttunementSpecification(q.requiresAttunement)
      : null,
  (q): ISpecification<CompendiumItemSnapshot> | null =>
    q.identified !== undefined ? new IdentifiedSpecification(q.identified) : null,
  (q): ISpecification<CompendiumItemSnapshot> | null =>
    q.hasActivities !== undefined
      ? new HasActivitiesSpecification(q.hasActivities)
      : null,
  (q): ISpecification<CompendiumItemSnapshot> | null =>
    q.isContainer !== undefined ? new IsContainerSpecification(q.isContainer) : null,
  (q): ISpecification<CompendiumItemSnapshot> | null =>
    q.weight !== undefined ? new WeightRangeSpecification(q.weight) : null,
  (q): ISpecification<CompendiumItemSnapshot> | null =>
    q.price !== undefined ? new PriceRangeSpecification(q.price) : null,
  (q): ISpecification<CompendiumItemSnapshot> | null =>
    q.spellLevel !== undefined ? new SpellLevelRangeSpecification(q.spellLevel) : null
];

export class CompendiumItemSpecificationBuilder {
  private readonly innerBuilder = new SpecificationBuilder<
    FilterCompendiumItemsQuery,
    CompendiumItemSnapshot
  >(COMPENDIUM_ITEM_SPEC_FACTORIES);

  build(query: FilterCompendiumItemsQuery): ISpecification<CompendiumItemSnapshot> {
    return this.innerBuilder.build(query);
  }
}
