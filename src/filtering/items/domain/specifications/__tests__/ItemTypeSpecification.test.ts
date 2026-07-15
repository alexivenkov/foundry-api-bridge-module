import { EnumSet } from '@/kernel/domain/value-objects';
import { ItemType } from '@/filtering/items/domain/value-objects';
import {
  CANTRIP_LIGHT,
  CASK,
  FIREBALL,
  LONGSWORD,
  POTION_OF_HEALING,
  RING_OF_PROTECTION
} from '@/filtering/items/domain/__tests__/fixtures/itemSnapshots';
import { ItemTypeSpecification } from '../ItemTypeSpecification';

describe('ItemTypeSpecification', () => {
  it('EnumSet[Weapon] matches only weapons', () => {
    const spec = new ItemTypeSpecification(new EnumSet<ItemType>([ItemType.Weapon]));
    expect(spec.isSatisfiedBy(LONGSWORD)).toBe(true);
    expect(spec.isSatisfiedBy(POTION_OF_HEALING)).toBe(false);
    expect(spec.isSatisfiedBy(FIREBALL)).toBe(false);
  });

  it('EnumSet[Spell] matches all spells (FIREBALL, CANTRIP_LIGHT)', () => {
    const spec = new ItemTypeSpecification(new EnumSet<ItemType>([ItemType.Spell]));
    expect(spec.isSatisfiedBy(FIREBALL)).toBe(true);
    expect(spec.isSatisfiedBy(CANTRIP_LIGHT)).toBe(true);
    expect(spec.isSatisfiedBy(LONGSWORD)).toBe(false);
    expect(spec.isSatisfiedBy(CASK)).toBe(false);
  });

  it('EnumSet[Weapon, Equipment] matches both (OR semantics)', () => {
    const spec = new ItemTypeSpecification(
      new EnumSet<ItemType>([ItemType.Weapon, ItemType.Equipment])
    );
    expect(spec.isSatisfiedBy(LONGSWORD)).toBe(true);
    expect(spec.isSatisfiedBy(RING_OF_PROTECTION)).toBe(true);
    expect(spec.isSatisfiedBy(POTION_OF_HEALING)).toBe(false);
  });

  it('EnumSet[Container] matches only CASK', () => {
    const spec = new ItemTypeSpecification(new EnumSet<ItemType>([ItemType.Container]));
    expect(spec.isSatisfiedBy(CASK)).toBe(true);
    expect(spec.isSatisfiedBy(LONGSWORD)).toBe(false);
  });
});
