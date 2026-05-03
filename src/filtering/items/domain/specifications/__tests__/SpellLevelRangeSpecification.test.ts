import { Range } from '@/filtering/shared/domain/value-objects';
import {
  CANTRIP_LIGHT,
  CASK,
  FIREBALL,
  LONGSWORD,
  POTION_OF_HEALING
} from '@/filtering/items/domain/__tests__/fixtures/itemSnapshots';
import { SpellLevelRangeSpecification } from '../SpellLevelRangeSpecification';

describe('SpellLevelRangeSpecification', () => {
  it('Range(3, 9) matches FIREBALL (level 3) but excludes CANTRIP_LIGHT (level 0)', () => {
    const spec = new SpellLevelRangeSpecification(new Range(3, 9));
    expect(spec.isSatisfiedBy(FIREBALL)).toBe(true);
    expect(spec.isSatisfiedBy(CANTRIP_LIGHT)).toBe(false);
  });

  it('Range(0, 0) matches CANTRIP_LIGHT exactly', () => {
    const spec = new SpellLevelRangeSpecification(new Range(0, 0));
    expect(spec.isSatisfiedBy(CANTRIP_LIGHT)).toBe(true);
    expect(spec.isSatisfiedBy(FIREBALL)).toBe(false);
  });

  it('Range(0, 9) matches all spells', () => {
    const spec = new SpellLevelRangeSpecification(new Range(0, 9));
    expect(spec.isSatisfiedBy(FIREBALL)).toBe(true);
    expect(spec.isSatisfiedBy(CANTRIP_LIGHT)).toBe(true);
  });

  it('silent-excludes non-spell items (spellLevel=null)', () => {
    const spec = new SpellLevelRangeSpecification(new Range(0, 9));
    expect(spec.isSatisfiedBy(LONGSWORD)).toBe(false);
    expect(spec.isSatisfiedBy(CASK)).toBe(false);
    expect(spec.isSatisfiedBy(POTION_OF_HEALING)).toBe(false);
  });
});
