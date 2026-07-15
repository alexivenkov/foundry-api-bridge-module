import { EnumSet, Range } from '@/kernel/domain/value-objects';
import {
  ItemRarity,
  SpellSchool
} from '@/filtering/items/domain/value-objects';
import {
  ALL_FIXTURES,
  CANTRIP_LIGHT,
  CASK,
  FIREBALL,
  LONGSWORD,
  POTION_OF_HEALING,
  RING_OF_PROTECTION,
  UNKNOWN_RING
} from '@/filtering/items/domain/__tests__/fixtures/itemSnapshots';
import type { ItemSnapshot } from '@/filtering/items/domain/snapshot';
import { FolderSpecification } from '../FolderSpecification';
import { IdentifiedSpecification } from '../IdentifiedSpecification';
import { ItemRaritySpecification } from '../ItemRaritySpecification';
import { PriceRangeSpecification } from '../PriceRangeSpecification';
import { RequiresAttunementSpecification } from '../RequiresAttunementSpecification';
import { SpellLevelRangeSpecification } from '../SpellLevelRangeSpecification';
import { SpellSchoolSpecification } from '../SpellSchoolSpecification';
import { WeightRangeSpecification } from '../WeightRangeSpecification';

/**
 * Silent-exclude invariant safety net.
 *
 * For every Specification that depends on a nullable field, verify that:
 *   - items with `field === null` ALWAYS return `false` (not throw, not true)
 *   - the spec accepts a maximally-permissive predicate (the only cause of
 *     `false` should be the null-check, not the predicate itself)
 */
describe('Item specifications — silent-exclude invariant', () => {
  const fixturesWithNullRarity = ALL_FIXTURES.filter((i) => i.rarity === null);
  const fixturesWithNullIdentified = ALL_FIXTURES.filter(
    (i) => i.identified === null
  );
  const fixturesWithNullAttunement = ALL_FIXTURES.filter(
    (i) => i.requiresAttunement === null
  );
  const fixturesWithNullWeight = ALL_FIXTURES.filter((i) => i.weight === null);
  const fixturesWithNullPrice = ALL_FIXTURES.filter((i) => i.priceGp === null);
  const fixturesWithNullSpellLevel = ALL_FIXTURES.filter(
    (i) => i.spellLevel === null
  );
  const fixturesWithNullSpellSchool = ALL_FIXTURES.filter(
    (i) => i.spellSchool === null
  );
  const fixturesWithNullFolderId = ALL_FIXTURES.filter((i) => i.folderId === null);

  const expectSilentExclusion = (
    items: readonly ItemSnapshot[],
    isSatisfied: (i: ItemSnapshot) => boolean
  ): void => {
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(isSatisfied(item)).toBe(false);
    }
  };

  it('ItemRaritySpecification — null rarity → false', () => {
    expect(fixturesWithNullRarity).toEqual(
      expect.arrayContaining([FIREBALL, CANTRIP_LIGHT, CASK])
    );
    const spec = new ItemRaritySpecification(
      new EnumSet<ItemRarity>(Object.values(ItemRarity))
    );
    expectSilentExclusion(fixturesWithNullRarity, (i) => spec.isSatisfiedBy(i));
  });

  it('IdentifiedSpecification — null identified → false', () => {
    expect(fixturesWithNullIdentified).toEqual(
      expect.arrayContaining([FIREBALL, CANTRIP_LIGHT])
    );
    const specTrue = new IdentifiedSpecification(true);
    const specFalse = new IdentifiedSpecification(false);
    expectSilentExclusion(fixturesWithNullIdentified, (i) =>
      specTrue.isSatisfiedBy(i)
    );
    expectSilentExclusion(fixturesWithNullIdentified, (i) =>
      specFalse.isSatisfiedBy(i)
    );
  });

  it('RequiresAttunementSpecification — null requiresAttunement → false', () => {
    expect(fixturesWithNullAttunement).toEqual(
      expect.arrayContaining([FIREBALL, CANTRIP_LIGHT])
    );
    const specTrue = new RequiresAttunementSpecification(true);
    const specFalse = new RequiresAttunementSpecification(false);
    expectSilentExclusion(fixturesWithNullAttunement, (i) =>
      specTrue.isSatisfiedBy(i)
    );
    expectSilentExclusion(fixturesWithNullAttunement, (i) =>
      specFalse.isSatisfiedBy(i)
    );
  });

  it('WeightRangeSpecification — null weight → false', () => {
    expect(fixturesWithNullWeight).toEqual(
      expect.arrayContaining([FIREBALL, CANTRIP_LIGHT])
    );
    const spec = new WeightRangeSpecification(new Range(undefined, 1_000_000));
    expectSilentExclusion(fixturesWithNullWeight, (i) => spec.isSatisfiedBy(i));
  });

  it('PriceRangeSpecification — null priceGp → false', () => {
    expect(fixturesWithNullPrice).toEqual(
      expect.arrayContaining([FIREBALL, CANTRIP_LIGHT, UNKNOWN_RING])
    );
    const spec = new PriceRangeSpecification(new Range(undefined, 1_000_000));
    expectSilentExclusion(fixturesWithNullPrice, (i) => spec.isSatisfiedBy(i));
  });

  it('SpellLevelRangeSpecification — null spellLevel → false', () => {
    expect(fixturesWithNullSpellLevel).toEqual(
      expect.arrayContaining([
        LONGSWORD,
        POTION_OF_HEALING,
        RING_OF_PROTECTION,
        CASK
      ])
    );
    const spec = new SpellLevelRangeSpecification(new Range(0, 9));
    expectSilentExclusion(fixturesWithNullSpellLevel, (i) =>
      spec.isSatisfiedBy(i)
    );
  });

  it('SpellSchoolSpecification — null spellSchool → false', () => {
    expect(fixturesWithNullSpellSchool).toEqual(
      expect.arrayContaining([LONGSWORD, CASK])
    );
    const spec = new SpellSchoolSpecification(
      new EnumSet<SpellSchool>(Object.values(SpellSchool))
    );
    expectSilentExclusion(fixturesWithNullSpellSchool, (i) =>
      spec.isSatisfiedBy(i)
    );
  });

  it('FolderSpecification — null folderId → false', () => {
    expect(fixturesWithNullFolderId).toEqual(expect.arrayContaining([CASK]));
    const spec = new FolderSpecification(
      new Set([
        'folder-weapons',
        'folder-potions',
        'folder-magic',
        'folder-spells'
      ])
    );
    expectSilentExclusion(fixturesWithNullFolderId, (i) => spec.isSatisfiedBy(i));
  });
});
