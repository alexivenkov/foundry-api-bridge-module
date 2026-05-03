import {
  SpecificationBuilder,
  type SpecificationFactory
} from '@/filtering/shared/application';
import type { ISpecification } from '@/filtering/shared/domain/specification';
import type { FolderResolver } from '@/filtering/shared/domain/repository';
import type { ActorSnapshot } from '@/filtering/actors/domain/snapshot';
import {
  AbilityScoreRangeSpecification,
  ActorTypeSpecification,
  ArmorClassRangeSpecification,
  ChallengeRatingRangeSpecification,
  CreatureTypeSpecification,
  CurrentHpRangeSpecification,
  DispositionSpecification,
  FolderSpecification,
  HasPlayerOwnerSpecification,
  LevelRangeSpecification,
  MaxHpRangeSpecification,
  NameContainsSpecification,
  SizeSpecification
} from '@/filtering/actors/domain/specifications';

import type { FilterActorsQuery } from './FilterActorsQuery';

// Re-exported here so existing handler/test consumers can keep importing
// `FolderResolver` from the actors application barrel.
export type { FolderResolver };

type ActorSpecFactory = SpecificationFactory<FilterActorsQuery, ActorSnapshot>;

const ACTOR_SPEC_FACTORIES: readonly ActorSpecFactory[] = [
  (q): ISpecification<ActorSnapshot> | null =>
    q.name !== undefined ? new NameContainsSpecification(q.name) : null,
  (q): ISpecification<ActorSnapshot> | null =>
    q.types !== undefined ? new ActorTypeSpecification(q.types) : null,
  (q): ISpecification<ActorSnapshot> | null =>
    q.creatureTypes !== undefined ? new CreatureTypeSpecification(q.creatureTypes) : null,
  (q): ISpecification<ActorSnapshot> | null =>
    q.sizes !== undefined ? new SizeSpecification(q.sizes) : null,
  (q): ISpecification<ActorSnapshot> | null =>
    q.dispositions !== undefined ? new DispositionSpecification(q.dispositions) : null,
  (q): ISpecification<ActorSnapshot> | null =>
    q.hasPlayerOwner !== undefined ? new HasPlayerOwnerSpecification(q.hasPlayerOwner) : null,
  (q): ISpecification<ActorSnapshot> | null =>
    q.cr !== undefined ? new ChallengeRatingRangeSpecification(q.cr) : null,
  (q): ISpecification<ActorSnapshot> | null =>
    q.level !== undefined ? new LevelRangeSpecification(q.level) : null,
  (q): ISpecification<ActorSnapshot> | null =>
    q.maxHp !== undefined ? new MaxHpRangeSpecification(q.maxHp) : null,
  (q): ISpecification<ActorSnapshot> | null =>
    q.currentHp !== undefined ? new CurrentHpRangeSpecification(q.currentHp) : null,
  (q): ISpecification<ActorSnapshot> | null =>
    q.ac !== undefined ? new ArmorClassRangeSpecification(q.ac) : null,
  (q): ISpecification<ActorSnapshot> | null =>
    q.abilities !== undefined ? new AbilityScoreRangeSpecification(q.abilities) : null
];

export class ActorSpecificationBuilder {
  private readonly innerBuilder: SpecificationBuilder<FilterActorsQuery, ActorSnapshot>;

  constructor(private readonly folderResolver: FolderResolver) {
    const folderFactory: ActorSpecFactory = (q): ISpecification<ActorSnapshot> | null =>
      q.folder !== undefined
        ? new FolderSpecification(this.folderResolver.resolve(q.folder))
        : null;

    this.innerBuilder = new SpecificationBuilder<FilterActorsQuery, ActorSnapshot>([
      ...ACTOR_SPEC_FACTORIES,
      folderFactory
    ]);
  }

  build(query: FilterActorsQuery): ISpecification<ActorSnapshot> {
    return this.innerBuilder.build(query);
  }
}
