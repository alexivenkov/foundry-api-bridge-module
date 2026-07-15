import { SpecificationBuilder, type SpecificationFactory } from '@/kernel';
import type { ISpecification } from '@/kernel';
import {
  Pf2eCategoryInSpecification,
  Pf2eLevelRangeSpecification,
  Pf2eNameContainsSpecification,
  Pf2ePriceRangeSpecification,
  Pf2eRarityInSpecification,
  Pf2eTraditionsAnySpecification,
  Pf2eTraitsAllSpecification,
  Pf2eTypeSpecification
} from '@/systems/pf2e/compendium-search/domain';
import type { Pf2eCompendiumItemSnapshot } from '@/systems/pf2e/compendium-search/domain';
import type { Pf2eFilterCompendiumItemsQuery } from './queries';

type ItemSpecFactory = SpecificationFactory<
  Pf2eFilterCompendiumItemsQuery,
  Pf2eCompendiumItemSnapshot
>;

const ITEM_SPEC_FACTORIES: readonly ItemSpecFactory[] = [
  (q): ISpecification<Pf2eCompendiumItemSnapshot> | null =>
    q.name !== undefined ? new Pf2eNameContainsSpecification(q.name) : null,
  (q): ISpecification<Pf2eCompendiumItemSnapshot> | null =>
    q.types !== undefined ? new Pf2eTypeSpecification(q.types) : null,
  (q): ISpecification<Pf2eCompendiumItemSnapshot> | null =>
    q.level !== undefined ? new Pf2eLevelRangeSpecification(q.level) : null,
  (q): ISpecification<Pf2eCompendiumItemSnapshot> | null =>
    q.traits !== undefined ? new Pf2eTraitsAllSpecification(q.traits) : null,
  (q): ISpecification<Pf2eCompendiumItemSnapshot> | null =>
    q.rarities !== undefined ? new Pf2eRarityInSpecification(q.rarities) : null,
  (q): ISpecification<Pf2eCompendiumItemSnapshot> | null =>
    q.categories !== undefined ? new Pf2eCategoryInSpecification(q.categories) : null,
  (q): ISpecification<Pf2eCompendiumItemSnapshot> | null =>
    q.traditions !== undefined ? new Pf2eTraditionsAnySpecification(q.traditions) : null,
  (q): ISpecification<Pf2eCompendiumItemSnapshot> | null =>
    q.priceGold !== undefined ? new Pf2ePriceRangeSpecification(q.priceGold) : null
];

export class Pf2eCompendiumItemSpecificationBuilder {
  private readonly innerBuilder = new SpecificationBuilder<
    Pf2eFilterCompendiumItemsQuery,
    Pf2eCompendiumItemSnapshot
  >(ITEM_SPEC_FACTORIES);

  build(
    query: Pf2eFilterCompendiumItemsQuery
  ): ISpecification<Pf2eCompendiumItemSnapshot> {
    return this.innerBuilder.build(query);
  }
}
