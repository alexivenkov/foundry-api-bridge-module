import { CompositeSpecification } from '@/filtering/shared/domain/specification';
import { ValidationError } from '@/filtering/shared/domain/errors';
import type { Range } from '@/filtering/shared/domain/value-objects';
import type { ActorSnapshot } from '@/filtering/actors/domain/snapshot';
import { ABILITY_KEYS, type AbilityKey } from '@/filtering/actors/domain/value-objects';

export type AbilityRangeMap = Partial<Record<AbilityKey, Range>>;

export class AbilityScoreRangeSpecification extends CompositeSpecification<ActorSnapshot> {
  constructor(private readonly ranges: AbilityRangeMap) {
    super();
    if (Object.keys(ranges).length === 0) {
      throw new ValidationError(
        'AbilityScoreRangeSpecification requires at least one ability range'
      );
    }
  }

  override isSatisfiedBy(actor: ActorSnapshot): boolean {
    if (actor.abilities === null) {
      return false;
    }
    for (const key of ABILITY_KEYS) {
      const range = this.ranges[key];
      if (range === undefined) {
        continue;
      }
      const value = actor.abilities[key];
      if (!range.contains(value)) {
        return false;
      }
    }
    return true;
  }
}
