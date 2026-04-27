import { EnumSet } from '@/filtering/shared/domain/value-objects';
import { CreatureType } from '@/filtering/actors/domain/value-objects';
import {
  ANCIENT_RED_DRAGON,
  FRODO,
  GANDALF,
  GOBLIN,
  PARTY_GROUP,
  WAGON
} from '@/filtering/actors/domain/__tests__/fixtures/actorSnapshots';
import { CreatureTypeSpecification } from '../CreatureTypeSpecification';

describe('CreatureTypeSpecification', () => {
  it('EnumSet[Dragon] matches ANCIENT_RED_DRAGON only', () => {
    const spec = new CreatureTypeSpecification(
      new EnumSet<CreatureType>([CreatureType.Dragon])
    );
    expect(spec.isSatisfiedBy(ANCIENT_RED_DRAGON)).toBe(true);
    expect(spec.isSatisfiedBy(GOBLIN)).toBe(false);
  });

  it('EnumSet[Humanoid] matches GOBLIN', () => {
    const spec = new CreatureTypeSpecification(
      new EnumSet<CreatureType>([CreatureType.Humanoid])
    );
    expect(spec.isSatisfiedBy(GOBLIN)).toBe(true);
  });

  it('EnumSet[Humanoid] silent-excludes GANDALF (creatureType=null)', () => {
    const spec = new CreatureTypeSpecification(
      new EnumSet<CreatureType>([CreatureType.Humanoid])
    );
    expect(spec.isSatisfiedBy(GANDALF)).toBe(false);
    expect(spec.isSatisfiedBy(FRODO)).toBe(false);
  });

  it('EnumSet[Undead] does not match GOBLIN (humanoid)', () => {
    const spec = new CreatureTypeSpecification(
      new EnumSet<CreatureType>([CreatureType.Undead])
    );
    expect(spec.isSatisfiedBy(GOBLIN)).toBe(false);
  });

  it('silent-excludes vehicles and groups (creatureType=null)', () => {
    const spec = new CreatureTypeSpecification(
      new EnumSet<CreatureType>([CreatureType.Humanoid, CreatureType.Dragon])
    );
    expect(spec.isSatisfiedBy(WAGON)).toBe(false);
    expect(spec.isSatisfiedBy(PARTY_GROUP)).toBe(false);
  });

  it('EnumSet[Humanoid, Dragon] (OR within set) matches GOBLIN and DRAGON', () => {
    const spec = new CreatureTypeSpecification(
      new EnumSet<CreatureType>([CreatureType.Humanoid, CreatureType.Dragon])
    );
    expect(spec.isSatisfiedBy(GOBLIN)).toBe(true);
    expect(spec.isSatisfiedBy(ANCIENT_RED_DRAGON)).toBe(true);
  });
});
