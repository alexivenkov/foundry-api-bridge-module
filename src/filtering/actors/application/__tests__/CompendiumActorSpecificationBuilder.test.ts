import { EnumSet, PaginationParams, Range, SubstringQuery } from '@/kernel';
import {
  ActorType,
  CreatureType,
  Disposition,
  Size
} from '@/filtering/actors/domain/value-objects';
import { AbilityKey } from '@/filtering/actors/domain/value-objects';
import type { CompendiumActorSnapshot } from '@/filtering/actors/domain/snapshot';
import { CompendiumActorSpecificationBuilder } from '../CompendiumActorSpecificationBuilder';
import type { FilterCompendiumActorsQuery } from '../FilterCompendiumActorsQuery';

function makeSnapshot(
  overrides: Partial<CompendiumActorSnapshot> = {}
): CompendiumActorSnapshot {
  return {
    id: 'a1',
    name: 'Goblin',
    type: ActorType.Npc,
    hasPlayerOwner: false,
    folderId: null,
    creatureType: CreatureType.Humanoid,
    size: Size.Small,
    disposition: Disposition.Hostile,
    cr: 0.25,
    level: null,
    hp: { current: 7, max: 7 },
    ac: 15,
    abilities: { str: 8, dex: 14, con: 10, int: 10, wis: 8, cha: 8 },
    packId: 'dnd5e.monsters',
    uuid: 'Compendium.dnd5e.monsters.Actor.a1',
    ...overrides
  };
}

function makeQuery(
  overrides: Partial<FilterCompendiumActorsQuery> = {}
): FilterCompendiumActorsQuery {
  return { pagination: PaginationParams.default(), ...overrides };
}

describe('CompendiumActorSpecificationBuilder', () => {
  const builder = new CompendiumActorSpecificationBuilder();

  it('matches everything when no filters are set', () => {
    const spec = builder.build(makeQuery());
    expect(spec.isSatisfiedBy(makeSnapshot())).toBe(true);
  });

  it.each([
    ['name', { name: new SubstringQuery('gob') }, {}, { name: 'Orc' }],
    [
      'types',
      { types: new EnumSet<ActorType>([ActorType.Npc]) },
      {},
      { type: ActorType.Character }
    ],
    [
      'creatureTypes',
      { creatureTypes: new EnumSet<CreatureType>([CreatureType.Humanoid]) },
      {},
      { creatureType: CreatureType.Dragon }
    ],
    [
      'sizes',
      { sizes: new EnumSet<Size>([Size.Small]) },
      {},
      { size: Size.Huge }
    ],
    [
      'dispositions',
      { dispositions: new EnumSet<Disposition>([Disposition.Hostile]) },
      {},
      { disposition: Disposition.Friendly }
    ],
    ['cr', { cr: new Range(0, 1) }, {}, { cr: 5 }],
    [
      'level',
      { level: new Range(1, 4) },
      { type: ActorType.Character, level: 3 },
      { type: ActorType.Character, level: 9 }
    ],
    ['maxHp', { maxHp: new Range(1, 10) }, {}, { hp: { current: 50, max: 50 } }],
    ['ac', { ac: new Range(10, 16) }, {}, { ac: 20 }],
    [
      'abilities',
      { abilities: { [AbilityKey.Dex]: new Range(12, 20) } },
      {},
      { abilities: { str: 8, dex: 6, con: 10, int: 10, wis: 8, cha: 8 } }
    ]
  ] as const)(
    'activates the %s filter',
    (_label, queryOverrides, matchOverrides, missOverrides) => {
      const spec = builder.build(makeQuery(queryOverrides));
      expect(spec.isSatisfiedBy(makeSnapshot(matchOverrides))).toBe(true);
      expect(spec.isSatisfiedBy(makeSnapshot(missOverrides))).toBe(false);
    }
  );

  it('combines filters with AND semantics', () => {
    const spec = builder.build(
      makeQuery({
        name: new SubstringQuery('gob'),
        cr: new Range(0, 1)
      })
    );

    expect(spec.isSatisfiedBy(makeSnapshot())).toBe(true);
    expect(spec.isSatisfiedBy(makeSnapshot({ name: 'Orc' }))).toBe(false);
    expect(spec.isSatisfiedBy(makeSnapshot({ cr: 10 }))).toBe(false);
  });

  it('silently excludes snapshots with null fields under range filters', () => {
    const spec = builder.build(makeQuery({ cr: new Range(0, 30) }));
    expect(spec.isSatisfiedBy(makeSnapshot({ cr: null }))).toBe(false);
  });
});
