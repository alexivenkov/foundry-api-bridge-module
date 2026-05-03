import { EnumSet } from '@/filtering/shared/domain/value-objects';
import { ItemRarity } from '@/filtering/items/domain/value-objects';
import {
  ARTIFACT_OF_DEAD,
  CANTRIP_LIGHT,
  FIREBALL,
  LONGSWORD,
  POTION_OF_HEALING,
  RING_OF_PROTECTION,
  UNKNOWN_RING
} from '@/filtering/items/domain/__tests__/fixtures/itemSnapshots';
import { ItemRaritySpecification } from '../ItemRaritySpecification';

describe('ItemRaritySpecification', () => {
  it('EnumSet[Common] matches only common-rarity items', () => {
    const spec = new ItemRaritySpecification(
      new EnumSet<ItemRarity>([ItemRarity.Common])
    );
    expect(spec.isSatisfiedBy(LONGSWORD)).toBe(true);
    expect(spec.isSatisfiedBy(POTION_OF_HEALING)).toBe(true);
    expect(spec.isSatisfiedBy(RING_OF_PROTECTION)).toBe(false);
  });

  it('EnumSet[Rare, Artifact] matches RING_OF_PROTECTION (rare) and ARTIFACT_OF_DEAD (artifact)', () => {
    const spec = new ItemRaritySpecification(
      new EnumSet<ItemRarity>([ItemRarity.Rare, ItemRarity.Artifact])
    );
    expect(spec.isSatisfiedBy(RING_OF_PROTECTION)).toBe(true);
    expect(spec.isSatisfiedBy(ARTIFACT_OF_DEAD)).toBe(true);
    expect(spec.isSatisfiedBy(UNKNOWN_RING)).toBe(true);
    expect(spec.isSatisfiedBy(LONGSWORD)).toBe(false);
  });

  it('silent-excludes spells (rarity=null) — FIREBALL, CANTRIP_LIGHT', () => {
    const spec = new ItemRaritySpecification(
      new EnumSet<ItemRarity>(Object.values(ItemRarity))
    );
    expect(spec.isSatisfiedBy(FIREBALL)).toBe(false);
    expect(spec.isSatisfiedBy(CANTRIP_LIGHT)).toBe(false);
  });
});
