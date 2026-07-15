import { EnumSet } from '@/kernel/domain/value-objects';
import { SpellSchool } from '@/filtering/items/domain/value-objects';
import {
  CANTRIP_LIGHT,
  CASK,
  FIREBALL,
  LONGSWORD
} from '@/filtering/items/domain/__tests__/fixtures/itemSnapshots';
import { SpellSchoolSpecification } from '../SpellSchoolSpecification';

describe('SpellSchoolSpecification', () => {
  it('EnumSet[Evocation] matches FIREBALL and CANTRIP_LIGHT (both evocation)', () => {
    const spec = new SpellSchoolSpecification(
      new EnumSet<SpellSchool>([SpellSchool.Evocation])
    );
    expect(spec.isSatisfiedBy(FIREBALL)).toBe(true);
    expect(spec.isSatisfiedBy(CANTRIP_LIGHT)).toBe(true);
  });

  it('EnumSet[Necromancy] excludes FIREBALL', () => {
    const spec = new SpellSchoolSpecification(
      new EnumSet<SpellSchool>([SpellSchool.Necromancy])
    );
    expect(spec.isSatisfiedBy(FIREBALL)).toBe(false);
  });

  it('silent-excludes non-spell items (spellSchool=null)', () => {
    const spec = new SpellSchoolSpecification(
      new EnumSet<SpellSchool>(Object.values(SpellSchool))
    );
    expect(spec.isSatisfiedBy(LONGSWORD)).toBe(false);
    expect(spec.isSatisfiedBy(CASK)).toBe(false);
  });
});
