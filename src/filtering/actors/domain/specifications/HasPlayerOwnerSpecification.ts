import { CompositeSpecification } from '@/filtering/shared/domain/specification';
import type { ActorSnapshot } from '@/filtering/actors/domain/snapshot';

export class HasPlayerOwnerSpecification extends CompositeSpecification<ActorSnapshot> {
  constructor(private readonly expected: boolean) {
    super();
  }

  override isSatisfiedBy(actor: ActorSnapshot): boolean {
    return actor.hasPlayerOwner === this.expected;
  }
}
