import { CompositeSpecification } from '@/kernel/domain/specification';
import type { SubstringQuery } from '@/kernel/domain/value-objects';
import type { ActorSnapshot } from '@/filtering/actors/domain/snapshot';

export class NameContainsSpecification extends CompositeSpecification<ActorSnapshot> {
  constructor(private readonly query: SubstringQuery) {
    super();
  }

  override isSatisfiedBy(actor: ActorSnapshot): boolean {
    return this.query.matches(actor.name);
  }
}
