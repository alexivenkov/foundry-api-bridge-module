import { CompositeSpecification } from '@/kernel/domain/specification';
import type { Range } from '@/kernel/domain/value-objects';
import type { ActorSnapshot } from '@/filtering/actors/domain/snapshot';

export class MaxHpRangeSpecification extends CompositeSpecification<ActorSnapshot> {
  constructor(private readonly range: Range) {
    super();
  }

  override isSatisfiedBy(actor: ActorSnapshot): boolean {
    if (actor.hp === null) {
      return false;
    }
    return this.range.contains(actor.hp.max);
  }
}
