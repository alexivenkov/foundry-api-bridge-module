import { EnumSet, PaginationParams, Range, SubstringQuery } from '@/kernel';
import { makeActorSnapshot, makeItemSnapshot } from '../../domain/__tests__/fixtures';
import { Pf2eCompendiumActorSpecificationBuilder } from '../Pf2eCompendiumActorSpecificationBuilder';
import { Pf2eCompendiumItemSpecificationBuilder } from '../Pf2eCompendiumItemSpecificationBuilder';

describe('Pf2eCompendiumActorSpecificationBuilder', () => {
  const builder = new Pf2eCompendiumActorSpecificationBuilder();
  const pagination = PaginationParams.default();

  it('matches everything when no filters are set', () => {
    expect(builder.build({ pagination }).isSatisfiedBy(makeActorSnapshot())).toBe(true);
  });

  it.each([
    ['name', { name: new SubstringQuery('zombie') }, {}, { name: 'Skeleton' }],
    ['types', { types: new EnumSet<string>(['npc']) }, {}, { type: 'hazard' }],
    ['level', { level: new Range(0, 2) }, {}, { level: 10 }],
    ['traits', { traits: ['undead'] }, {}, { traits: ['construct'] }],
    ['rarities', { rarities: new EnumSet<string>(['common']) }, {}, { rarity: 'rare' }],
    ['sizes', { sizes: new EnumSet<string>(['med']) }, {}, { size: 'grg' }],
    ['maxHp', { maxHp: new Range(10, 30) }, {}, { hp: { current: 5, max: 200 } }],
    ['ac', { ac: new Range(10, 15) }, {}, { ac: 30 }]
  ] as const)('activates the %s filter', (_label, filters, matchO, missO) => {
    const spec = builder.build({ pagination, ...filters });
    expect(spec.isSatisfiedBy(makeActorSnapshot(matchO))).toBe(true);
    expect(spec.isSatisfiedBy(makeActorSnapshot(missO))).toBe(false);
  });

  it('combines filters with AND semantics', () => {
    const spec = builder.build({
      pagination,
      traits: ['undead'],
      level: new Range(0, 2)
    });
    expect(spec.isSatisfiedBy(makeActorSnapshot())).toBe(true);
    expect(spec.isSatisfiedBy(makeActorSnapshot({ level: 8 }))).toBe(false);
  });
});

describe('Pf2eCompendiumItemSpecificationBuilder', () => {
  const builder = new Pf2eCompendiumItemSpecificationBuilder();
  const pagination = PaginationParams.default();

  it.each([
    ['name', { name: new SubstringQuery('charge') }, {}, { name: 'Power Attack' }],
    ['types', { types: new EnumSet<string>(['feat']) }, {}, { type: 'spell' }],
    ['level', { level: new Range(1, 4) }, {}, { level: 12 }],
    ['traits', { traits: ['fighter'] }, {}, { traits: ['wizard'] }],
    ['rarities', { rarities: new EnumSet<string>(['common']) }, {}, { rarity: 'unique' }],
    ['categories', { categories: new EnumSet<string>(['class']) }, {}, { category: 'skill' }],
    [
      'traditions',
      { traditions: new EnumSet<string>(['arcane']) },
      { traditions: ['arcane', 'occult'] },
      { traditions: ['divine'] }
    ],
    [
      'priceGold',
      { priceGold: new Range(1, 100) },
      { priceGold: 15 },
      { priceGold: 5000 }
    ]
  ] as const)('activates the %s filter', (_label, filters, matchO, missO) => {
    const spec = builder.build({ pagination, ...filters });
    expect(spec.isSatisfiedBy(makeItemSnapshot(matchO))).toBe(true);
    expect(spec.isSatisfiedBy(makeItemSnapshot(missO))).toBe(false);
  });
});
