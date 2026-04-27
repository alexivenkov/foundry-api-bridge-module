import { CompositeSpecification } from '@/filtering/shared/domain/specification';
import type { SubstringQuery } from '@/filtering/shared/domain/value-objects';
import type { ActorSnapshot } from '@/filtering/actors/domain/snapshot';

export class NameContainsSpecification extends CompositeSpecification<ActorSnapshot> {
  constructor(private readonly query: SubstringQuery) {
    super();
  }

  override isSatisfiedBy(actor: ActorSnapshot): boolean {
    return this.query.matches(actor.name);
  }
}
