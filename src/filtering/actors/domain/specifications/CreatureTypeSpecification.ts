import { CompositeSpecification } from '@/kernel/domain/specification';
import type { EnumSet } from '@/kernel/domain/value-objects';
import type { ActorSnapshot } from '@/filtering/actors/domain/snapshot';
import type { CreatureType } from '@/filtering/actors/domain/value-objects';

export class CreatureTypeSpecification extends CompositeSpecification<ActorSnapshot> {
  constructor(private readonly creatureTypes: EnumSet<CreatureType>) {
    super();
  }

  override isSatisfiedBy(actor: ActorSnapshot): boolean {
    if (actor.creatureType === null) {
      return false;
    }
    return this.creatureTypes.has(actor.creatureType);
  }
}
