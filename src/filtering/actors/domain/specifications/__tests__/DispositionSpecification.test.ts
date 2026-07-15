import { EnumSet } from '@/kernel/domain/value-objects';
import { Disposition } from '@/filtering/actors/domain/value-objects';
import {
  ANCIENT_RED_DRAGON,
  FRODO,
  GANDALF,
  GOBLIN,
  PARTY_GROUP,
  WAGON
} from '@/filtering/actors/domain/__tests__/fixtures/actorSnapshots';
import { DispositionSpecification } from '../DispositionSpecification';

describe('DispositionSpecification', () => {
  it('EnumSet[Hostile] matches GOBLIN and ANCIENT_RED_DRAGON', () => {
    const spec = new DispositionSpecification(
      new EnumSet<Disposition>([Disposition.Hostile])
    );
    expect(spec.isSatisfiedBy(GOBLIN)).toBe(true);
    expect(spec.isSatisfiedBy(ANCIENT_RED_DRAGON)).toBe(true);
    expect(spec.isSatisfiedBy(GANDALF)).toBe(false);
  });

  it('EnumSet[Friendly] matches GANDALF, FRODO, and PARTY_GROUP', () => {
    const spec = new DispositionSpecification(
      new EnumSet<Disposition>([Disposition.Friendly])
    );
    expect(spec.isSatisfiedBy(GANDALF)).toBe(true);
    expect(spec.isSatisfiedBy(FRODO)).toBe(true);
    expect(spec.isSatisfiedBy(PARTY_GROUP)).toBe(true);
    expect(spec.isSatisfiedBy(GOBLIN)).toBe(false);
  });

  it('EnumSet[Neutral] matches only WAGON', () => {
    const spec = new DispositionSpecification(
      new EnumSet<Disposition>([Disposition.Neutral])
    );
    expect(spec.isSatisfiedBy(WAGON)).toBe(true);
    expect(spec.isSatisfiedBy(GANDALF)).toBe(false);
    expect(spec.isSatisfiedBy(GOBLIN)).toBe(false);
  });

  it('EnumSet[Hostile, Friendly] (OR within set) matches both groups', () => {
    const spec = new DispositionSpecification(
      new EnumSet<Disposition>([Disposition.Hostile, Disposition.Friendly])
    );
    expect(spec.isSatisfiedBy(GANDALF)).toBe(true);
    expect(spec.isSatisfiedBy(GOBLIN)).toBe(true);
    expect(spec.isSatisfiedBy(WAGON)).toBe(false);
  });
});
