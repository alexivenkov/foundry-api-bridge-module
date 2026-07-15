import { EnumSet } from '@/kernel/domain/value-objects';
import { ActorType } from '@/filtering/actors/domain/value-objects';
import {
  ANCIENT_RED_DRAGON,
  FRODO,
  GANDALF,
  GOBLIN,
  PARTY_GROUP,
  WAGON
} from '@/filtering/actors/domain/__tests__/fixtures/actorSnapshots';
import { ActorTypeSpecification } from '../ActorTypeSpecification';

describe('ActorTypeSpecification', () => {
  it('EnumSet[Npc] matches NPCs only', () => {
    const spec = new ActorTypeSpecification(new EnumSet<ActorType>([ActorType.Npc]));
    expect(spec.isSatisfiedBy(GOBLIN)).toBe(true);
    expect(spec.isSatisfiedBy(ANCIENT_RED_DRAGON)).toBe(true);
    expect(spec.isSatisfiedBy(GANDALF)).toBe(false);
    expect(spec.isSatisfiedBy(FRODO)).toBe(false);
  });

  it('EnumSet[Character, Npc] matches both characters and NPCs (OR within set)', () => {
    const spec = new ActorTypeSpecification(
      new EnumSet<ActorType>([ActorType.Character, ActorType.Npc])
    );
    expect(spec.isSatisfiedBy(GANDALF)).toBe(true);
    expect(spec.isSatisfiedBy(FRODO)).toBe(true);
    expect(spec.isSatisfiedBy(GOBLIN)).toBe(true);
    expect(spec.isSatisfiedBy(ANCIENT_RED_DRAGON)).toBe(true);
    expect(spec.isSatisfiedBy(WAGON)).toBe(false);
    expect(spec.isSatisfiedBy(PARTY_GROUP)).toBe(false);
  });

  it('EnumSet[Vehicle] matches only WAGON', () => {
    const spec = new ActorTypeSpecification(new EnumSet<ActorType>([ActorType.Vehicle]));
    expect(spec.isSatisfiedBy(WAGON)).toBe(true);
    expect(spec.isSatisfiedBy(GANDALF)).toBe(false);
    expect(spec.isSatisfiedBy(GOBLIN)).toBe(false);
    expect(spec.isSatisfiedBy(PARTY_GROUP)).toBe(false);
  });

  it('EnumSet[Group] matches only PARTY_GROUP', () => {
    const spec = new ActorTypeSpecification(new EnumSet<ActorType>([ActorType.Group]));
    expect(spec.isSatisfiedBy(PARTY_GROUP)).toBe(true);
    expect(spec.isSatisfiedBy(GANDALF)).toBe(false);
  });

  it('EnumSet[Character] excludes NPCs and vehicles', () => {
    const spec = new ActorTypeSpecification(new EnumSet<ActorType>([ActorType.Character]));
    expect(spec.isSatisfiedBy(GANDALF)).toBe(true);
    expect(spec.isSatisfiedBy(FRODO)).toBe(true);
    expect(spec.isSatisfiedBy(GOBLIN)).toBe(false);
    expect(spec.isSatisfiedBy(WAGON)).toBe(false);
  });
});
