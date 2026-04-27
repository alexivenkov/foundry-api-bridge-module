import { EnumSet } from '@/filtering/shared/domain/value-objects';
import { Size } from '@/filtering/actors/domain/value-objects';
import {
  ANCIENT_RED_DRAGON,
  FRODO,
  GANDALF,
  GOBLIN,
  PARTY_GROUP,
  WAGON
} from '@/filtering/actors/domain/__tests__/fixtures/actorSnapshots';
import { SizeSpecification } from '../SizeSpecification';

describe('SizeSpecification', () => {
  it('EnumSet[Small] matches FRODO and GOBLIN, excludes GANDALF', () => {
    const spec = new SizeSpecification(new EnumSet<Size>([Size.Small]));
    expect(spec.isSatisfiedBy(FRODO)).toBe(true);
    expect(spec.isSatisfiedBy(GOBLIN)).toBe(true);
    expect(spec.isSatisfiedBy(GANDALF)).toBe(false);
  });

  it('EnumSet[Gargantuan] matches only ANCIENT_RED_DRAGON', () => {
    const spec = new SizeSpecification(new EnumSet<Size>([Size.Gargantuan]));
    expect(spec.isSatisfiedBy(ANCIENT_RED_DRAGON)).toBe(true);
    expect(spec.isSatisfiedBy(GANDALF)).toBe(false);
    expect(spec.isSatisfiedBy(WAGON)).toBe(false);
  });

  it('EnumSet[Tiny, Small] (OR within set) matches FRODO and GOBLIN', () => {
    const spec = new SizeSpecification(new EnumSet<Size>([Size.Tiny, Size.Small]));
    expect(spec.isSatisfiedBy(FRODO)).toBe(true);
    expect(spec.isSatisfiedBy(GOBLIN)).toBe(true);
    expect(spec.isSatisfiedBy(GANDALF)).toBe(false);
  });

  it('EnumSet[Medium] matches GANDALF', () => {
    const spec = new SizeSpecification(new EnumSet<Size>([Size.Medium]));
    expect(spec.isSatisfiedBy(GANDALF)).toBe(true);
    expect(spec.isSatisfiedBy(FRODO)).toBe(false);
  });

  it('EnumSet[Large] matches WAGON', () => {
    const spec = new SizeSpecification(new EnumSet<Size>([Size.Large]));
    expect(spec.isSatisfiedBy(WAGON)).toBe(true);
  });

  it('silent-excludes PARTY_GROUP (size=null)', () => {
    const spec = new SizeSpecification(new EnumSet<Size>([Size.Medium, Size.Large]));
    expect(spec.isSatisfiedBy(PARTY_GROUP)).toBe(false);
  });
});
