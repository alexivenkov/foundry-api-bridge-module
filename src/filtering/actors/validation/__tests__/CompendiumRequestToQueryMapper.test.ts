import { PaginationParams, Range, SubstringQuery, EnumSet } from '@/kernel';
import { ActorType, AbilityKey } from '@/filtering/actors/domain/value-objects';
import { CompendiumRequestToQueryMapper } from '../CompendiumRequestToQueryMapper';

describe('CompendiumRequestToQueryMapper', () => {
  it('maps an empty request to default pagination only', () => {
    const query = CompendiumRequestToQueryMapper.toQuery({});
    expect(query.pagination).toEqual(PaginationParams.default());
    expect(query.name).toBeUndefined();
    expect(query.types).toBeUndefined();
    expect(query).not.toHaveProperty('packIds');
  });

  it('maps filters into domain value objects', () => {
    const query = CompendiumRequestToQueryMapper.toQuery({
      name: 'Goblin',
      type: ['npc'],
      cr: { min: 1, max: 5 },
      abilities: { dex: { min: 12, max: 20 } },
      limit: 10,
      offset: 20
    });

    expect(query.name).toBeInstanceOf(SubstringQuery);
    expect(query.types).toBeInstanceOf(EnumSet);
    expect(query.types?.has(ActorType.Npc)).toBe(true);
    expect(query.cr).toBeInstanceOf(Range);
    expect(query.cr?.contains(3)).toBe(true);
    expect(query.abilities?.[AbilityKey.Dex]).toBeInstanceOf(Range);
    expect(query.pagination.limit).toBe(10);
    expect(query.pagination.offset).toBe(20);
  });

  it('maps creatureType/size/disposition enum sets', () => {
    const query = CompendiumRequestToQueryMapper.toQuery({
      creatureType: ['humanoid'],
      size: ['sm'],
      disposition: ['hostile']
    });
    expect(query.creatureTypes?.size()).toBe(1);
    expect(query.sizes?.size()).toBe(1);
    expect(query.dispositions?.size()).toBe(1);
  });

  it('maps level/maxHp/ac ranges', () => {
    const query = CompendiumRequestToQueryMapper.toQuery({
      level: { min: 1 },
      maxHp: { max: 50 },
      ac: { min: 12, max: 18 }
    });
    expect(query.level?.contains(2)).toBe(true);
    expect(query.maxHp?.contains(51)).toBe(false);
    expect(query.ac?.contains(15)).toBe(true);
  });
});
