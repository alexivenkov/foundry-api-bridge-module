import { EnumSet, Range } from '@/kernel/domain/value-objects';
import {
  AbilityKey,
  CreatureType,
  Disposition,
  Size
} from '@/filtering/actors/domain/value-objects';
import {
  ALL_FIXTURES,
  ANCIENT_RED_DRAGON,
  FRODO,
  GANDALF,
  GOBLIN,
  PARTY_GROUP,
  WAGON
} from '@/filtering/actors/domain/__tests__/fixtures/actorSnapshots';
import type { ActorSnapshot } from '@/filtering/actors/domain/snapshot';
import { AbilityScoreRangeSpecification } from '../AbilityScoreRangeSpecification';
import { ArmorClassRangeSpecification } from '../ArmorClassRangeSpecification';
import { ChallengeRatingRangeSpecification } from '../ChallengeRatingRangeSpecification';
import { CreatureTypeSpecification } from '../CreatureTypeSpecification';
import { CurrentHpRangeSpecification } from '../CurrentHpRangeSpecification';
import { DispositionSpecification } from '../DispositionSpecification';
import { FolderSpecification } from '../FolderSpecification';
import { LevelRangeSpecification } from '../LevelRangeSpecification';
import { MaxHpRangeSpecification } from '../MaxHpRangeSpecification';
import { SizeSpecification } from '../SizeSpecification';

/**
 * Silent-exclude invariant safety net.
 *
 * For every Specification that depends on a nullable field, verify that:
 *   - actors with `field === null` ALWAYS return `false` (not throw, not true)
 *   - the spec accepts a maximally-permissive predicate (the only cause of
 *     `false` should be the null-check, not the predicate itself)
 */
describe('Specifications — silent-exclude invariant', () => {
  const fixturesWithNullCr = ALL_FIXTURES.filter((a) => a.cr === null);
  const fixturesWithNullLevel = ALL_FIXTURES.filter((a) => a.level === null);
  const fixturesWithNullHp = ALL_FIXTURES.filter((a) => a.hp === null);
  const fixturesWithNullAc = ALL_FIXTURES.filter((a) => a.ac === null);
  const fixturesWithNullCreatureType = ALL_FIXTURES.filter(
    (a) => a.creatureType === null
  );
  const fixturesWithNullSize = ALL_FIXTURES.filter((a) => a.size === null);
  const fixturesWithNullDisposition = ALL_FIXTURES.filter(
    (a) => a.disposition === null
  );
  const fixturesWithNullAbilities = ALL_FIXTURES.filter(
    (a) => a.abilities === null
  );
  const fixturesWithNullFolderId = ALL_FIXTURES.filter((a) => a.folderId === null);

  const expectSilentExclusion = (
    actors: readonly ActorSnapshot[],
    isSatisfied: (a: ActorSnapshot) => boolean
  ): void => {
    expect(actors.length).toBeGreaterThan(0);
    for (const actor of actors) {
      expect(isSatisfied(actor)).toBe(false);
    }
  };

  it('ChallengeRatingRangeSpecification — null cr → false', () => {
    expect(fixturesWithNullCr).toEqual(
      expect.arrayContaining([GANDALF, FRODO, WAGON, PARTY_GROUP])
    );
    const spec = new ChallengeRatingRangeSpecification(new Range(undefined, 1_000_000));
    expectSilentExclusion(fixturesWithNullCr, (a) => spec.isSatisfiedBy(a));
  });

  it('LevelRangeSpecification — null level → false', () => {
    expect(fixturesWithNullLevel).toEqual(
      expect.arrayContaining([GOBLIN, ANCIENT_RED_DRAGON, WAGON, PARTY_GROUP])
    );
    const spec = new LevelRangeSpecification(new Range(undefined, 1_000_000));
    expectSilentExclusion(fixturesWithNullLevel, (a) => spec.isSatisfiedBy(a));
  });

  it('MaxHpRangeSpecification — null hp → false', () => {
    expect(fixturesWithNullHp).toEqual(expect.arrayContaining([PARTY_GROUP]));
    const spec = new MaxHpRangeSpecification(new Range(undefined, 1_000_000));
    expectSilentExclusion(fixturesWithNullHp, (a) => spec.isSatisfiedBy(a));
  });

  it('CurrentHpRangeSpecification — null hp → false', () => {
    expect(fixturesWithNullHp).toEqual(expect.arrayContaining([PARTY_GROUP]));
    const spec = new CurrentHpRangeSpecification(new Range(undefined, 1_000_000));
    expectSilentExclusion(fixturesWithNullHp, (a) => spec.isSatisfiedBy(a));
  });

  it('ArmorClassRangeSpecification — null ac → false', () => {
    expect(fixturesWithNullAc).toEqual(expect.arrayContaining([PARTY_GROUP]));
    const spec = new ArmorClassRangeSpecification(new Range(undefined, 1_000_000));
    expectSilentExclusion(fixturesWithNullAc, (a) => spec.isSatisfiedBy(a));
  });

  it('CreatureTypeSpecification — null creatureType → false', () => {
    expect(fixturesWithNullCreatureType).toEqual(
      expect.arrayContaining([GANDALF, FRODO, WAGON, PARTY_GROUP])
    );
    const spec = new CreatureTypeSpecification(
      new EnumSet<CreatureType>(Object.values(CreatureType))
    );
    expectSilentExclusion(fixturesWithNullCreatureType, (a) => spec.isSatisfiedBy(a));
  });

  it('SizeSpecification — null size → false', () => {
    expect(fixturesWithNullSize).toEqual(expect.arrayContaining([PARTY_GROUP]));
    const spec = new SizeSpecification(new EnumSet<Size>(Object.values(Size)));
    expectSilentExclusion(fixturesWithNullSize, (a) => spec.isSatisfiedBy(a));
  });

  it('DispositionSpecification — null disposition → false', () => {
    // All current fixtures have a disposition; we still verify behavior on
    // a synthesized null-disposition snapshot to lock the contract.
    const synth: ActorSnapshot = { ...GANDALF, disposition: null };
    const spec = new DispositionSpecification(
      new EnumSet<Disposition>(Object.values(Disposition))
    );
    expect(spec.isSatisfiedBy(synth)).toBe(false);
    // Sanity: no fixture currently exhibits null disposition.
    expect(fixturesWithNullDisposition).toEqual([]);
  });

  it('AbilityScoreRangeSpecification — null abilities → false', () => {
    expect(fixturesWithNullAbilities).toEqual(
      expect.arrayContaining([WAGON, PARTY_GROUP])
    );
    const spec = new AbilityScoreRangeSpecification({
      [AbilityKey.Str]: new Range(undefined, 1_000_000)
    });
    expectSilentExclusion(fixturesWithNullAbilities, (a) => spec.isSatisfiedBy(a));
  });

  it('FolderSpecification — null folderId → false', () => {
    expect(fixturesWithNullFolderId).toEqual(expect.arrayContaining([ANCIENT_RED_DRAGON]));
    const spec = new FolderSpecification(
      new Set([
        'folder-pcs',
        'folder-npcs',
        'folder-vehicles',
        'folder-groups'
      ])
    );
    expectSilentExclusion(fixturesWithNullFolderId, (a) => spec.isSatisfiedBy(a));
  });
});
