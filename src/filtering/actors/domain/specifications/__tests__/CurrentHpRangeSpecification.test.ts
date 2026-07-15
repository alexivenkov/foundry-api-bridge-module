import { Range } from '@/kernel/domain/value-objects';
import {
  ANCIENT_RED_DRAGON,
  FRODO,
  GANDALF,
  GOBLIN,
  PARTY_GROUP,
  WAGON
} from '@/filtering/actors/domain/__tests__/fixtures/actorSnapshots';
import { CurrentHpRangeSpecification } from '../CurrentHpRangeSpecification';

describe('CurrentHpRangeSpecification', () => {
  it('Range(undefined, 30) matches GOBLIN (current=7) and FRODO (current=28)', () => {
    const spec = new CurrentHpRangeSpecification(new Range(undefined, 30));
    expect(spec.isSatisfiedBy(GOBLIN)).toBe(true);
    expect(spec.isSatisfiedBy(FRODO)).toBe(true);
    expect(spec.isSatisfiedBy(GANDALF)).toBe(false);
    expect(spec.isSatisfiedBy(ANCIENT_RED_DRAGON)).toBe(false);
    expect(spec.isSatisfiedBy(WAGON)).toBe(false);
  });

  it('Range(100, undefined) matches GANDALF (current=145) and DRAGON (current=546)', () => {
    const spec = new CurrentHpRangeSpecification(new Range(100, undefined));
    expect(spec.isSatisfiedBy(GANDALF)).toBe(true);
    expect(spec.isSatisfiedBy(ANCIENT_RED_DRAGON)).toBe(true);
    expect(spec.isSatisfiedBy(FRODO)).toBe(false);
  });

  it('silent-excludes PARTY_GROUP (hp=null)', () => {
    const spec = new CurrentHpRangeSpecification(new Range(0, 10_000));
    expect(spec.isSatisfiedBy(PARTY_GROUP)).toBe(false);
  });

  it('uses current not max — FRODO (current=28) does NOT match Range(30, undefined)', () => {
    const spec = new CurrentHpRangeSpecification(new Range(30, undefined));
    expect(spec.isSatisfiedBy(FRODO)).toBe(false);
  });

  it('boundary inclusion — Range(28, 28) matches FRODO current HP exactly', () => {
    const spec = new CurrentHpRangeSpecification(new Range(28, 28));
    expect(spec.isSatisfiedBy(FRODO)).toBe(true);
  });
});
