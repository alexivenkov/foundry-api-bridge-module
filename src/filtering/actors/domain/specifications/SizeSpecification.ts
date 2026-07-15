import { CompositeSpecification } from '@/kernel/domain/specification';
import type { EnumSet } from '@/kernel/domain/value-objects';
import type { ActorSnapshot } from '@/filtering/actors/domain/snapshot';
import type { Size } from '@/filtering/actors/domain/value-objects';

export class SizeSpecification extends CompositeSpecification<ActorSnapshot> {
  constructor(private readonly sizes: EnumSet<Size>) {
    super();
  }

  override isSatisfiedBy(actor: ActorSnapshot): boolean {
    if (actor.size === null) {
      return false;
    }
    return this.sizes.has(actor.size);
  }
}
