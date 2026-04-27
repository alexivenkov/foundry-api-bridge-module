import { Range } from '@/filtering/shared/domain/value-objects';
import {
  ANCIENT_RED_DRAGON,
  FRODO,
  GANDALF,
  GOBLIN,
  PARTY_GROUP,
  WAGON
} from '@/filtering/actors/domain/__tests__/fixtures/actorSnapshots';
import { ChallengeRatingRangeSpecification } from '../ChallengeRatingRangeSpecification';

describe('ChallengeRatingRangeSpecification', () => {
  it('Range(0, 1) matches GOBLIN (cr=0.25), excludes DRAGON (cr=24)', () => {
    const spec = new ChallengeRatingRangeSpecification(new Range(0, 1));
    expect(spec.isSatisfiedBy(GOBLIN)).toBe(true);
    expect(spec.isSatisfiedBy(ANCIENT_RED_DRAGON)).toBe(false);
  });

  it('Range(20, undefined) matches DRAGON, excludes GOBLIN', () => {
    const spec = new ChallengeRatingRangeSpecification(new Range(20, undefined));
    expect(spec.isSatisfiedBy(ANCIENT_RED_DRAGON)).toBe(true);
    expect(spec.isSatisfiedBy(GOBLIN)).toBe(false);
  });

  it('Range(undefined, 0.5) matches GOBLIN, excludes DRAGON', () => {
    const spec = new ChallengeRatingRangeSpecification(new Range(undefined, 0.5));
    expect(spec.isSatisfiedBy(GOBLIN)).toBe(true);
    expect(spec.isSatisfiedBy(ANCIENT_RED_DRAGON)).toBe(false);
  });

  it('silent-excludes PCs (cr=null)', () => {
    const spec = new ChallengeRatingRangeSpecification(new Range(0, 30));
    expect(spec.isSatisfiedBy(GANDALF)).toBe(false);
    expect(spec.isSatisfiedBy(FRODO)).toBe(false);
  });

  it('silent-excludes vehicles and groups (cr=null)', () => {
    const spec = new ChallengeRatingRangeSpecification(new Range(undefined, 100));
    expect(spec.isSatisfiedBy(WAGON)).toBe(false);
    expect(spec.isSatisfiedBy(PARTY_GROUP)).toBe(false);
  });

  it('boundary inclusion — Range(0.25, 0.25) matches GOBLIN exactly', () => {
    const spec = new ChallengeRatingRangeSpecification(new Range(0.25, 0.25));
    expect(spec.isSatisfiedBy(GOBLIN)).toBe(true);
  });
});
