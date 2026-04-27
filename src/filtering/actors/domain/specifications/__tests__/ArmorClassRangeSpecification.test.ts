import { Range } from '@/filtering/shared/domain/value-objects';
import {
  ANCIENT_RED_DRAGON,
  FRODO,
  GANDALF,
  GOBLIN,
  PARTY_GROUP,
  WAGON
} from '@/filtering/actors/domain/__tests__/fixtures/actorSnapshots';
import { ArmorClassRangeSpecification } from '../ArmorClassRangeSpecification';

describe('ArmorClassRangeSpecification', () => {
  it('Range(15, undefined) matches GOBLIN (15), GANDALF (17), DRAGON (22)', () => {
    const spec = new ArmorClassRangeSpecification(new Range(15, undefined));
    expect(spec.isSatisfiedBy(GOBLIN)).toBe(true);
    expect(spec.isSatisfiedBy(GANDALF)).toBe(true);
    expect(spec.isSatisfiedBy(ANCIENT_RED_DRAGON)).toBe(true);
    expect(spec.isSatisfiedBy(FRODO)).toBe(false);
    expect(spec.isSatisfiedBy(WAGON)).toBe(false);
  });

  it('Range(undefined, 14) matches FRODO (13) and WAGON (12)', () => {
    const spec = new ArmorClassRangeSpecification(new Range(undefined, 14));
    expect(spec.isSatisfiedBy(FRODO)).toBe(true);
    expect(spec.isSatisfiedBy(WAGON)).toBe(true);
    expect(spec.isSatisfiedBy(GOBLIN)).toBe(false);
    expect(spec.isSatisfiedBy(GANDALF)).toBe(false);
  });

  it('silent-excludes PARTY_GROUP (ac=null)', () => {
    const spec = new ArmorClassRangeSpecification(new Range(0, 30));
    expect(spec.isSatisfiedBy(PARTY_GROUP)).toBe(false);
  });

  it('boundary inclusion — Range(15, 15) matches GOBLIN exactly', () => {
    const spec = new ArmorClassRangeSpecification(new Range(15, 15));
    expect(spec.isSatisfiedBy(GOBLIN)).toBe(true);
    expect(spec.isSatisfiedBy(GANDALF)).toBe(false);
  });
});
