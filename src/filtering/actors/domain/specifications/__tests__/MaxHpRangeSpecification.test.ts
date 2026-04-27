import { Range } from '@/filtering/shared/domain/value-objects';
import {
  ANCIENT_RED_DRAGON,
  FRODO,
  GANDALF,
  GOBLIN,
  PARTY_GROUP,
  WAGON
} from '@/filtering/actors/domain/__tests__/fixtures/actorSnapshots';
import { MaxHpRangeSpecification } from '../MaxHpRangeSpecification';

describe('MaxHpRangeSpecification', () => {
  it('Range(100, undefined) matches GANDALF (max=145) and DRAGON (max=546)', () => {
    const spec = new MaxHpRangeSpecification(new Range(100, undefined));
    expect(spec.isSatisfiedBy(GANDALF)).toBe(true);
    expect(spec.isSatisfiedBy(ANCIENT_RED_DRAGON)).toBe(true);
    expect(spec.isSatisfiedBy(FRODO)).toBe(false);
    expect(spec.isSatisfiedBy(GOBLIN)).toBe(false);
    expect(spec.isSatisfiedBy(WAGON)).toBe(false);
  });

  it('Range(undefined, 50) matches GOBLIN, FRODO, and WAGON', () => {
    const spec = new MaxHpRangeSpecification(new Range(undefined, 50));
    expect(spec.isSatisfiedBy(GOBLIN)).toBe(true);
    expect(spec.isSatisfiedBy(FRODO)).toBe(true);
    expect(spec.isSatisfiedBy(WAGON)).toBe(true);
    expect(spec.isSatisfiedBy(GANDALF)).toBe(false);
    expect(spec.isSatisfiedBy(ANCIENT_RED_DRAGON)).toBe(false);
  });

  it('silent-excludes PARTY_GROUP (hp=null)', () => {
    const spec = new MaxHpRangeSpecification(new Range(0, 1000));
    expect(spec.isSatisfiedBy(PARTY_GROUP)).toBe(false);
  });

  it('uses max not current — FRODO (current=28, max=32) matches Range(30, undefined)', () => {
    const spec = new MaxHpRangeSpecification(new Range(30, undefined));
    expect(spec.isSatisfiedBy(FRODO)).toBe(true);
  });

  it('boundary inclusion — Range(7, 7) matches GOBLIN exactly', () => {
    const spec = new MaxHpRangeSpecification(new Range(7, 7));
    expect(spec.isSatisfiedBy(GOBLIN)).toBe(true);
  });
});
