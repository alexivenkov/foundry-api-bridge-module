import { SpecificationBuilder, type SpecificationFactory } from '@/kernel';
import type { ISpecification } from '@/kernel';
import type { CompendiumActorSnapshot } from '@/filtering/actors/domain/snapshot';
import {
  AbilityScoreRangeSpecification,
  ActorTypeSpecification,
  ArmorClassRangeSpecification,
  ChallengeRatingRangeSpecification,
  CreatureTypeSpecification,
  DispositionSpecification,
  LevelRangeSpecification,
  MaxHpRangeSpecification,
  NameContainsSpecification,
  SizeSpecification
} from '@/filtering/actors/domain/specifications';

import type { FilterCompendiumActorsQuery } from './FilterCompendiumActorsQuery';

type CompendiumActorSpecFactory = SpecificationFactory<
  FilterCompendiumActorsQuery,
  CompendiumActorSnapshot
>;

// Reuses the world-filtering specification classes verbatim — they are typed
// against ActorSnapshot, which CompendiumActorSnapshot extends.
const COMPENDIUM_ACTOR_SPEC_FACTORIES: readonly CompendiumActorSpecFactory[] = [
  (q): ISpecification<CompendiumActorSnapshot> | null =>
    q.name !== undefined ? new NameContainsSpecification(q.name) : null,
  (q): ISpecification<CompendiumActorSnapshot> | null =>
    q.types !== undefined ? new ActorTypeSpecification(q.types) : null,
  (q): ISpecification<CompendiumActorSnapshot> | null =>
    q.creatureTypes !== undefined ? new CreatureTypeSpecification(q.creatureTypes) : null,
  (q): ISpecification<CompendiumActorSnapshot> | null =>
    q.sizes !== undefined ? new SizeSpecification(q.sizes) : null,
  (q): ISpecification<CompendiumActorSnapshot> | null =>
    q.dispositions !== undefined ? new DispositionSpecification(q.dispositions) : null,
  (q): ISpecification<CompendiumActorSnapshot> | null =>
    q.cr !== undefined ? new ChallengeRatingRangeSpecification(q.cr) : null,
  (q): ISpecification<CompendiumActorSnapshot> | null =>
    q.level !== undefined ? new LevelRangeSpecification(q.level) : null,
  (q): ISpecification<CompendiumActorSnapshot> | null =>
    q.maxHp !== undefined ? new MaxHpRangeSpecification(q.maxHp) : null,
  (q): ISpecification<CompendiumActorSnapshot> | null =>
    q.ac !== undefined ? new ArmorClassRangeSpecification(q.ac) : null,
  (q): ISpecification<CompendiumActorSnapshot> | null =>
    q.abilities !== undefined ? new AbilityScoreRangeSpecification(q.abilities) : null
];

export class CompendiumActorSpecificationBuilder {
  private readonly innerBuilder = new SpecificationBuilder<
    FilterCompendiumActorsQuery,
    CompendiumActorSnapshot
  >(COMPENDIUM_ACTOR_SPEC_FACTORIES);

  build(query: FilterCompendiumActorsQuery): ISpecification<CompendiumActorSnapshot> {
    return this.innerBuilder.build(query);
  }
}
