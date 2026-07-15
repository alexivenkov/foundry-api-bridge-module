import { CompositeSpecification } from '@/kernel';
import type { EnumSet, Range, SubstringQuery } from '@/kernel';
import type { Pf2eSearchableDocument } from '@/systems/pf2e/compendium-search/domain/snapshot';

export class Pf2eNameContainsSpecification<
  T extends Pf2eSearchableDocument
> extends CompositeSpecification<T> {
  constructor(private readonly query: SubstringQuery) {
    super();
  }

  override isSatisfiedBy(candidate: T): boolean {
    return this.query.matches(candidate.name);
  }
}

export class Pf2eTypeSpecification<
  T extends Pf2eSearchableDocument
> extends CompositeSpecification<T> {
  constructor(private readonly types: EnumSet<string>) {
    super();
  }

  override isSatisfiedBy(candidate: T): boolean {
    return this.types.has(candidate.type);
  }
}

export class Pf2eLevelRangeSpecification<
  T extends Pf2eSearchableDocument
> extends CompositeSpecification<T> {
  constructor(private readonly range: Range) {
    super();
  }

  override isSatisfiedBy(candidate: T): boolean {
    if (candidate.level === null) {
      return false;
    }
    return this.range.contains(candidate.level);
  }
}

// AND semantics: the candidate must carry every requested trait — the common
// refinement case ("undead" AND "incorporeal").
export class Pf2eTraitsAllSpecification<
  T extends Pf2eSearchableDocument
> extends CompositeSpecification<T> {
  constructor(private readonly requiredTraits: readonly string[]) {
    super();
  }

  override isSatisfiedBy(candidate: T): boolean {
    return this.requiredTraits.every(trait => candidate.traits.includes(trait));
  }
}

export class Pf2eRarityInSpecification<
  T extends Pf2eSearchableDocument
> extends CompositeSpecification<T> {
  constructor(private readonly rarities: EnumSet<string>) {
    super();
  }

  override isSatisfiedBy(candidate: T): boolean {
    if (candidate.rarity === null) {
      return false;
    }
    return this.rarities.has(candidate.rarity);
  }
}
