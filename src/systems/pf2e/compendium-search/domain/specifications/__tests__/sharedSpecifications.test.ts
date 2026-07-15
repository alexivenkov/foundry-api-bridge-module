import { EnumSet, Range, SubstringQuery } from '@/kernel';
import { makeActorSnapshot } from '../../__tests__/fixtures';
import {
  Pf2eLevelRangeSpecification,
  Pf2eNameContainsSpecification,
  Pf2eRarityInSpecification,
  Pf2eTraitsAllSpecification,
  Pf2eTypeSpecification
} from '../sharedSpecifications';

describe('pf2e shared specifications', () => {
  it('name matches case-insensitively by substring', () => {
    const spec = new Pf2eNameContainsSpecification(new SubstringQuery('zombie'));
    expect(spec.isSatisfiedBy(makeActorSnapshot())).toBe(true);
    expect(spec.isSatisfiedBy(makeActorSnapshot({ name: 'Skeleton Guard' }))).toBe(false);
  });

  it('type matches by membership', () => {
    const spec = new Pf2eTypeSpecification(new EnumSet<string>(['npc', 'hazard']));
    expect(spec.isSatisfiedBy(makeActorSnapshot())).toBe(true);
    expect(spec.isSatisfiedBy(makeActorSnapshot({ type: 'vehicle' }))).toBe(false);
  });

  it('level range is inclusive and silently excludes null levels', () => {
    const spec = new Pf2eLevelRangeSpecification(new Range(1, 3));
    expect(spec.isSatisfiedBy(makeActorSnapshot({ level: 1 }))).toBe(true);
    expect(spec.isSatisfiedBy(makeActorSnapshot({ level: 3 }))).toBe(true);
    expect(spec.isSatisfiedBy(makeActorSnapshot({ level: 4 }))).toBe(false);
    expect(spec.isSatisfiedBy(makeActorSnapshot({ level: null }))).toBe(false);
  });

  it('level range supports negative creature levels', () => {
    const spec = new Pf2eLevelRangeSpecification(new Range(-1, 0));
    expect(spec.isSatisfiedBy(makeActorSnapshot({ level: -1 }))).toBe(true);
  });

  it('traits require ALL requested traits to be present', () => {
    const spec = new Pf2eTraitsAllSpecification(['undead', 'mindless']);
    expect(spec.isSatisfiedBy(makeActorSnapshot())).toBe(true);
    expect(
      spec.isSatisfiedBy(makeActorSnapshot({ traits: ['undead', 'incorporeal'] }))
    ).toBe(false);
    expect(spec.isSatisfiedBy(makeActorSnapshot({ traits: [] }))).toBe(false);
  });

  it('rarity matches by membership and silently excludes null rarity', () => {
    const spec = new Pf2eRarityInSpecification(new EnumSet<string>(['uncommon', 'rare']));
    expect(spec.isSatisfiedBy(makeActorSnapshot({ rarity: 'rare' }))).toBe(true);
    expect(spec.isSatisfiedBy(makeActorSnapshot())).toBe(false);
    expect(spec.isSatisfiedBy(makeActorSnapshot({ rarity: null }))).toBe(false);
  });
});
