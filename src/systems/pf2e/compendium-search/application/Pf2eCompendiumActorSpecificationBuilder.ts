import { SpecificationBuilder, type SpecificationFactory } from '@/kernel';
import type { ISpecification } from '@/kernel';
import {
  Pf2eAcRangeSpecification,
  Pf2eLevelRangeSpecification,
  Pf2eMaxHpRangeSpecification,
  Pf2eNameContainsSpecification,
  Pf2eRarityInSpecification,
  Pf2eSizeInSpecification,
  Pf2eTraitsAllSpecification,
  Pf2eTypeSpecification
} from '@/systems/pf2e/compendium-search/domain';
import type { Pf2eCompendiumActorSnapshot } from '@/systems/pf2e/compendium-search/domain';
import type { Pf2eFilterCompendiumActorsQuery } from './queries';

type ActorSpecFactory = SpecificationFactory<
  Pf2eFilterCompendiumActorsQuery,
  Pf2eCompendiumActorSnapshot
>;

const ACTOR_SPEC_FACTORIES: readonly ActorSpecFactory[] = [
  (q): ISpecification<Pf2eCompendiumActorSnapshot> | null =>
    q.name !== undefined ? new Pf2eNameContainsSpecification(q.name) : null,
  (q): ISpecification<Pf2eCompendiumActorSnapshot> | null =>
    q.types !== undefined ? new Pf2eTypeSpecification(q.types) : null,
  (q): ISpecification<Pf2eCompendiumActorSnapshot> | null =>
    q.level !== undefined ? new Pf2eLevelRangeSpecification(q.level) : null,
  (q): ISpecification<Pf2eCompendiumActorSnapshot> | null =>
    q.traits !== undefined ? new Pf2eTraitsAllSpecification(q.traits) : null,
  (q): ISpecification<Pf2eCompendiumActorSnapshot> | null =>
    q.rarities !== undefined ? new Pf2eRarityInSpecification(q.rarities) : null,
  (q): ISpecification<Pf2eCompendiumActorSnapshot> | null =>
    q.sizes !== undefined ? new Pf2eSizeInSpecification(q.sizes) : null,
  (q): ISpecification<Pf2eCompendiumActorSnapshot> | null =>
    q.maxHp !== undefined ? new Pf2eMaxHpRangeSpecification(q.maxHp) : null,
  (q): ISpecification<Pf2eCompendiumActorSnapshot> | null =>
    q.ac !== undefined ? new Pf2eAcRangeSpecification(q.ac) : null
];

export class Pf2eCompendiumActorSpecificationBuilder {
  private readonly innerBuilder = new SpecificationBuilder<
    Pf2eFilterCompendiumActorsQuery,
    Pf2eCompendiumActorSnapshot
  >(ACTOR_SPEC_FACTORIES);

  build(
    query: Pf2eFilterCompendiumActorsQuery
  ): ISpecification<Pf2eCompendiumActorSnapshot> {
    return this.innerBuilder.build(query);
  }
}
