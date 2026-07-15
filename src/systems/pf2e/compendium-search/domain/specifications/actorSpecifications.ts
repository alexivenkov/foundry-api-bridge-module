import { CompositeSpecification } from '@/kernel';
import type { EnumSet, Range } from '@/kernel';
import type { Pf2eCompendiumActorSnapshot } from '@/systems/pf2e/compendium-search/domain/snapshot';

export class Pf2eSizeInSpecification extends CompositeSpecification<Pf2eCompendiumActorSnapshot> {
  constructor(private readonly sizes: EnumSet<string>) {
    super();
  }

  override isSatisfiedBy(actor: Pf2eCompendiumActorSnapshot): boolean {
    if (actor.size === null) {
      return false;
    }
    return this.sizes.has(actor.size);
  }
}

export class Pf2eMaxHpRangeSpecification extends CompositeSpecification<Pf2eCompendiumActorSnapshot> {
  constructor(private readonly range: Range) {
    super();
  }

  override isSatisfiedBy(actor: Pf2eCompendiumActorSnapshot): boolean {
    if (actor.hp === null) {
      return false;
    }
    return this.range.contains(actor.hp.max);
  }
}

export class Pf2eAcRangeSpecification extends CompositeSpecification<Pf2eCompendiumActorSnapshot> {
  constructor(private readonly range: Range) {
    super();
  }

  override isSatisfiedBy(actor: Pf2eCompendiumActorSnapshot): boolean {
    if (actor.ac === null) {
      return false;
    }
    return this.range.contains(actor.ac);
  }
}
