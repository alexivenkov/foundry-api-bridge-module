import { EnumSet, PaginationParams, Range, SubstringQuery } from '@/kernel';
import {
  ItemRarity,
  ItemType,
  SpellSchool
} from '@/filtering/items/domain/value-objects';
import type { CompendiumItemSnapshot } from '@/filtering/items/domain/snapshot';
import { CompendiumItemSpecificationBuilder } from '../CompendiumItemSpecificationBuilder';
import type { FilterCompendiumItemsQuery } from '../FilterCompendiumItemsQuery';

function makeSnapshot(
  overrides: Partial<CompendiumItemSnapshot> = {}
): CompendiumItemSnapshot {
  return {
    id: 'i1',
    name: 'Fireball',
    type: ItemType.Spell,
    folderId: null,
    rarity: ItemRarity.Common,
    identified: true,
    requiresAttunement: false,
    weight: 0,
    priceGp: 100,
    spellLevel: 3,
    spellSchool: SpellSchool.Evocation,
    hasActivities: true,
    isContainer: false,
    packId: 'dnd5e.spells',
    uuid: 'Compendium.dnd5e.spells.Item.i1',
    ...overrides
  };
}

function makeQuery(
  overrides: Partial<FilterCompendiumItemsQuery> = {}
): FilterCompendiumItemsQuery {
  return { pagination: PaginationParams.default(), ...overrides };
}

describe('CompendiumItemSpecificationBuilder', () => {
  const builder = new CompendiumItemSpecificationBuilder();

  it('matches everything when no filters are set', () => {
    expect(builder.build(makeQuery()).isSatisfiedBy(makeSnapshot())).toBe(true);
  });

  it.each([
    ['name', { name: new SubstringQuery('fire') }, {}, { name: 'Shield' }],
    [
      'types',
      { types: new EnumSet<ItemType>([ItemType.Spell]) },
      {},
      { type: ItemType.Weapon }
    ],
    [
      'rarities',
      { rarities: new EnumSet<ItemRarity>([ItemRarity.Common]) },
      {},
      { rarity: ItemRarity.Legendary }
    ],
    [
      'spellSchools',
      { spellSchools: new EnumSet<SpellSchool>([SpellSchool.Evocation]) },
      {},
      { spellSchool: SpellSchool.Necromancy }
    ],
    [
      'requiresAttunement',
      { requiresAttunement: true },
      { requiresAttunement: true },
      { requiresAttunement: false }
    ],
    ['identified', { identified: false }, { identified: false }, { identified: true }],
    ['hasActivities', { hasActivities: true }, {}, { hasActivities: false }],
    [
      'isContainer',
      { isContainer: true },
      { isContainer: true },
      { isContainer: false }
    ],
    ['weight', { weight: new Range(0, 1) }, {}, { weight: 50 }],
    ['price', { price: new Range(50, 200) }, {}, { priceGp: 5000 }],
    ['spellLevel', { spellLevel: new Range(1, 3) }, {}, { spellLevel: 9 }]
  ] as const)(
    'activates the %s filter',
    (_label, queryOverrides, matchOverrides, missOverrides) => {
      const spec = builder.build(makeQuery(queryOverrides));
      expect(spec.isSatisfiedBy(makeSnapshot(matchOverrides))).toBe(true);
      expect(spec.isSatisfiedBy(makeSnapshot(missOverrides))).toBe(false);
    }
  );

  it('combines filters with AND semantics and keeps silent-exclude for nulls', () => {
    const spec = builder.build(
      makeQuery({
        spellLevel: new Range(1, 3),
        spellSchools: new EnumSet<SpellSchool>([SpellSchool.Evocation])
      })
    );

    expect(spec.isSatisfiedBy(makeSnapshot())).toBe(true);
    expect(spec.isSatisfiedBy(makeSnapshot({ spellLevel: null }))).toBe(false);
    expect(
      spec.isSatisfiedBy(makeSnapshot({ type: ItemType.Weapon, spellLevel: null, spellSchool: null }))
    ).toBe(false);
  });
});
