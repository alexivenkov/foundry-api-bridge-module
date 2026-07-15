import { EnumSet, PaginationParams, Range, SubstringQuery } from '@/kernel';
import { ItemRarity, ItemType, SpellSchool } from '@/filtering/items/domain/value-objects';
import { CompendiumRequestToQueryMapper } from '../CompendiumRequestToQueryMapper';

describe('CompendiumRequestToQueryMapper (items)', () => {
  it('maps an empty request to default pagination only', () => {
    const query = CompendiumRequestToQueryMapper.toQuery({});
    expect(query.pagination).toEqual(PaginationParams.default());
    expect(query.types).toBeUndefined();
    expect(query).not.toHaveProperty('packIds');
  });

  it('maps filters into domain value objects', () => {
    const query = CompendiumRequestToQueryMapper.toQuery({
      name: 'Fire',
      type: ['spell'],
      rarity: ['veryRare'],
      spellSchool: ['evocation'],
      requiresAttunement: true,
      identified: false,
      hasActivities: true,
      isContainer: false,
      weight: { max: 1 },
      price: { min: 10 },
      spellLevel: { min: 1, max: 3 },
      limit: 5,
      offset: 10
    });

    expect(query.name).toBeInstanceOf(SubstringQuery);
    expect(query.types).toBeInstanceOf(EnumSet);
    expect(query.types?.has(ItemType.Spell)).toBe(true);
    expect(query.rarities?.has(ItemRarity.VeryRare)).toBe(true);
    expect(query.spellSchools?.has(SpellSchool.Evocation)).toBe(true);
    expect(query.requiresAttunement).toBe(true);
    expect(query.identified).toBe(false);
    expect(query.hasActivities).toBe(true);
    expect(query.isContainer).toBe(false);
    expect(query.weight).toBeInstanceOf(Range);
    expect(query.price?.contains(9)).toBe(false);
    expect(query.spellLevel?.contains(2)).toBe(true);
    expect(query.pagination.limit).toBe(5);
    expect(query.pagination.offset).toBe(10);
  });
});
