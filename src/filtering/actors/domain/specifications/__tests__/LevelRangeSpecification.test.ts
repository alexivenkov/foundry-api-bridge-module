import { Range } from '@/filtering/shared/domain/value-objects';
import {
  ANCIENT_RED_DRAGON,
  FRODO,
  GANDALF,
  GOBLIN,
  PARTY_GROUP,
  WAGON
} from '@/filtering/actors/domain/__tests__/fixtures/actorSnapshots';
import { LevelRangeSpecification } from '../LevelRangeSpecification';

describe('LevelRangeSpecification', () => {
  it('Range(1, 5) matches FRODO (level=4), excludes GANDALF (level=18)', () => {
    const spec = new LevelRangeSpecification(new Range(1, 5));
    expect(spec.isSatisfiedBy(FRODO)).toBe(true);
    expect(spec.isSatisfiedBy(GANDALF)).toBe(false);
  });

  it('Range(15, undefined) matches GANDALF, excludes FRODO', () => {
    const spec = new LevelRangeSpecification(new Range(15, undefined));
    expect(spec.isSatisfiedBy(GANDALF)).toBe(true);
    expect(spec.isSatisfiedBy(FRODO)).toBe(false);
  });

  it('Range(undefined, 10) matches FRODO, excludes GANDALF', () => {
    const spec = new LevelRangeSpecification(new Range(undefined, 10));
    expect(spec.isSatisfiedBy(FRODO)).toBe(true);
    expect(spec.isSatisfiedBy(GANDALF)).toBe(false);
  });

  it('silent-excludes NPCs (level=null)', () => {
    const spec = new LevelRangeSpecification(new Range(1, 30));
    expect(spec.isSatisfiedBy(GOBLIN)).toBe(false);
    expect(spec.isSatisfiedBy(ANCIENT_RED_DRAGON)).toBe(false);
  });

  it('silent-excludes vehicles and groups (level=null)', () => {
    const spec = new LevelRangeSpecification(new Range(1, 30));
    expect(spec.isSatisfiedBy(WAGON)).toBe(false);
    expect(spec.isSatisfiedBy(PARTY_GROUP)).toBe(false);
  });

  it('boundary inclusion — Range(4, 4) matches FRODO exactly', () => {
    const spec = new LevelRangeSpecification(new Range(4, 4));
    expect(spec.isSatisfiedBy(FRODO)).toBe(true);
  });
});
