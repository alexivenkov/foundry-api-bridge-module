import { CompositeSpecification } from '@/kernel/domain/specification';
import type { EnumSet } from '@/kernel/domain/value-objects';
import type { ActorSnapshot } from '@/filtering/actors/domain/snapshot';
import type { ActorType } from '@/filtering/actors/domain/value-objects';

export class ActorTypeSpecification extends CompositeSpecification<ActorSnapshot> {
  constructor(private readonly types: EnumSet<ActorType>) {
    super();
  }

  override isSatisfiedBy(actor: ActorSnapshot): boolean {
    return this.types.has(actor.type);
  }
}
