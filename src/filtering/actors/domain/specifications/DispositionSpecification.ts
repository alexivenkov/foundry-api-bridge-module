import { CompositeSpecification } from '@/filtering/shared/domain/specification';
import type { EnumSet } from '@/filtering/shared/domain/value-objects';
import type { ActorSnapshot } from '@/filtering/actors/domain/snapshot';
import type { Disposition } from '@/filtering/actors/domain/value-objects';

export class DispositionSpecification extends CompositeSpecification<ActorSnapshot> {
  constructor(private readonly dispositions: EnumSet<Disposition>) {
    super();
  }

  override isSatisfiedBy(actor: ActorSnapshot): boolean {
    if (actor.disposition === null) {
      return false;
    }
    return this.dispositions.has(actor.disposition);
  }
}
