import { CompositeSpecification } from '@/filtering/shared/domain/specification';
import type { Range } from '@/filtering/shared/domain/value-objects';
import type { ActorSnapshot } from '@/filtering/actors/domain/snapshot';

export class ChallengeRatingRangeSpecification extends CompositeSpecification<ActorSnapshot> {
  constructor(private readonly range: Range) {
    super();
  }

  override isSatisfiedBy(actor: ActorSnapshot): boolean {
    if (actor.cr === null) {
      return false;
    }
    return this.range.contains(actor.cr);
  }
}
