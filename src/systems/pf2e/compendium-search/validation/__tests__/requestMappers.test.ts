import { EnumSet, PaginationParams, Range, SubstringQuery } from '@/kernel';
import {
  toPf2eFilterCompendiumActorsQuery,
  toPf2eFilterCompendiumItemsQuery
} from '../requestMappers';

describe('toPf2eFilterCompendiumActorsQuery', () => {
  it('maps an empty request to default pagination only', () => {
    const query = toPf2eFilterCompendiumActorsQuery({});
    expect(query.pagination).toEqual(PaginationParams.default());
    expect(query).not.toHaveProperty('packIds');
    expect(query.name).toBeUndefined();
  });

  it('maps every filter into domain value objects', () => {
    const query = toPf2eFilterCompendiumActorsQuery({
      name: 'Zombie',
      type: ['npc'],
      level: { min: -1, max: 4 },
      traits: ['undead', 'mindless'],
      rarity: ['common'],
      size: ['med'],
      maxHp: { max: 50 },
      ac: { min: 10 },
      limit: 10,
      offset: 5
    });

    expect(query.name).toBeInstanceOf(SubstringQuery);
    expect(query.types).toBeInstanceOf(EnumSet);
    expect(query.level).toBeInstanceOf(Range);
    expect(query.level?.contains(-1)).toBe(true);
    expect(query.traits).toEqual(['undead', 'mindless']);
    expect(query.rarities?.has('common')).toBe(true);
    expect(query.sizes?.has('med')).toBe(true);
    expect(query.maxHp?.contains(51)).toBe(false);
    expect(query.ac?.contains(12)).toBe(true);
    expect(query.pagination.limit).toBe(10);
    expect(query.pagination.offset).toBe(5);
  });
});

describe('toPf2eFilterCompendiumItemsQuery', () => {
  it('maps an empty request to default pagination only', () => {
    const query = toPf2eFilterCompendiumItemsQuery({});
    expect(query.pagination).toEqual(PaginationParams.default());
    expect(query.name).toBeUndefined();
  });

  it('maps item-specific filters', () => {
    const query = toPf2eFilterCompendiumItemsQuery({
      name: 'Fire',
      type: ['feat'],
      category: ['class', 'skill'],
      traditions: ['arcane'],
      priceGold: { min: 1, max: 100 },
      traits: ['fighter'],
      rarity: ['uncommon'],
      level: { min: 1 }
    });

    expect(query.name).toBeInstanceOf(SubstringQuery);
    expect(query.types?.has('feat')).toBe(true);
    expect(query.categories?.has('skill')).toBe(true);
    expect(query.traditions?.has('arcane')).toBe(true);
    expect(query.priceGold?.contains(50)).toBe(true);
    expect(query.traits).toEqual(['fighter']);
    expect(query.rarities?.has('uncommon')).toBe(true);
    expect(query.level?.contains(1)).toBe(true);
  });
});
