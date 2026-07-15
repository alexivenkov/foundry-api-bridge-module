import {
  SpecificationBuilder,
  type SpecificationFactory
} from '@/kernel/application';
import type { ISpecification } from '@/kernel/domain/specification';
import type { FolderResolver } from '@/kernel/domain/repository';
import type { ItemSnapshot } from '@/filtering/items/domain/snapshot';
import {
  FolderSpecification,
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

import type { FilterItemsQuery } from './FilterItemsQuery';

type ItemSpecFactory = SpecificationFactory<FilterItemsQuery, ItemSnapshot>;

const ITEM_SPEC_FACTORIES: readonly ItemSpecFactory[] = [
  (q): ISpecification<ItemSnapshot> | null =>
    q.name !== undefined ? new NameContainsSpecification(q.name) : null,
  (q): ISpecification<ItemSnapshot> | null =>
    q.types !== undefined ? new ItemTypeSpecification(q.types) : null,
  (q): ISpecification<ItemSnapshot> | null =>
    q.rarities !== undefined ? new ItemRaritySpecification(q.rarities) : null,
  (q): ISpecification<ItemSnapshot> | null =>
    q.spellSchools !== undefined
      ? new SpellSchoolSpecification(q.spellSchools)
      : null,
  (q): ISpecification<ItemSnapshot> | null =>
    q.requiresAttunement !== undefined
      ? new RequiresAttunementSpecification(q.requiresAttunement)
      : null,
  (q): ISpecification<ItemSnapshot> | null =>
    q.identified !== undefined ? new IdentifiedSpecification(q.identified) : null,
  (q): ISpecification<ItemSnapshot> | null =>
    q.hasActivities !== undefined
      ? new HasActivitiesSpecification(q.hasActivities)
      : null,
  (q): ISpecification<ItemSnapshot> | null =>
    q.isContainer !== undefined ? new IsContainerSpecification(q.isContainer) : null,
  (q): ISpecification<ItemSnapshot> | null =>
    q.weight !== undefined ? new WeightRangeSpecification(q.weight) : null,
  (q): ISpecification<ItemSnapshot> | null =>
    q.price !== undefined ? new PriceRangeSpecification(q.price) : null,
  (q): ISpecification<ItemSnapshot> | null =>
    q.spellLevel !== undefined
      ? new SpellLevelRangeSpecification(q.spellLevel)
      : null
];

export class ItemSpecificationBuilder {
  private readonly innerBuilder: SpecificationBuilder<FilterItemsQuery, ItemSnapshot>;

  constructor(private readonly folderResolver: FolderResolver) {
    const folderFactory: ItemSpecFactory = (q): ISpecification<ItemSnapshot> | null =>
      q.folder !== undefined
        ? new FolderSpecification(this.folderResolver.resolve(q.folder))
        : null;

    this.innerBuilder = new SpecificationBuilder<FilterItemsQuery, ItemSnapshot>([
      ...ITEM_SPEC_FACTORIES,
      folderFactory
    ]);
  }

  build(query: FilterItemsQuery): ISpecification<ItemSnapshot> {
    return this.innerBuilder.build(query);
  }
}
