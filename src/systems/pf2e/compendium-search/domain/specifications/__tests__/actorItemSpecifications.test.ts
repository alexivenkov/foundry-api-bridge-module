import { EnumSet, Range } from '@/kernel';
import { makeActorSnapshot, makeItemSnapshot } from '../../__tests__/fixtures';
import {
  Pf2eAcRangeSpecification,
  Pf2eMaxHpRangeSpecification,
  Pf2eSizeInSpecification
} from '../actorSpecifications';
import {
  Pf2eCategoryInSpecification,
  Pf2ePriceRangeSpecification,
  Pf2eTraditionsAnySpecification
} from '../itemSpecifications';

describe('pf2e actor specifications', () => {
  it('size matches by membership with null silent-exclude', () => {
    const spec = new Pf2eSizeInSpecification(new EnumSet<string>(['med', 'lg']));
    expect(spec.isSatisfiedBy(makeActorSnapshot())).toBe(true);
    expect(spec.isSatisfiedBy(makeActorSnapshot({ size: 'tiny' }))).toBe(false);
    expect(spec.isSatisfiedBy(makeActorSnapshot({ size: null }))).toBe(false);
  });

  it('max hp range works on hp.max with null silent-exclude', () => {
    const spec = new Pf2eMaxHpRangeSpecification(new Range(10, 30));
    expect(spec.isSatisfiedBy(makeActorSnapshot())).toBe(true);
    expect(
      spec.isSatisfiedBy(makeActorSnapshot({ hp: { current: 5, max: 100 } }))
    ).toBe(false);
    expect(spec.isSatisfiedBy(makeActorSnapshot({ hp: null }))).toBe(false);
  });

  it('ac range with null silent-exclude', () => {
    const spec = new Pf2eAcRangeSpecification(new Range(12, 15));
    expect(spec.isSatisfiedBy(makeActorSnapshot())).toBe(true);
    expect(spec.isSatisfiedBy(makeActorSnapshot({ ac: 22 }))).toBe(false);
    expect(spec.isSatisfiedBy(makeActorSnapshot({ ac: null }))).toBe(false);
  });
});

describe('pf2e item specifications', () => {
  it('category matches by membership with null silent-exclude', () => {
    const spec = new Pf2eCategoryInSpecification(new EnumSet<string>(['class']));
    expect(spec.isSatisfiedBy(makeItemSnapshot())).toBe(true);
    expect(spec.isSatisfiedBy(makeItemSnapshot({ category: 'skill' }))).toBe(false);
    expect(spec.isSatisfiedBy(makeItemSnapshot({ category: null }))).toBe(false);
  });

  it('traditions match by ANY overlap; empty traditions never match', () => {
    const spec = new Pf2eTraditionsAnySpecification(
      new EnumSet<string>(['arcane', 'divine'])
    );
    expect(
      spec.isSatisfiedBy(makeItemSnapshot({ traditions: ['arcane', 'occult'] }))
    ).toBe(true);
    expect(spec.isSatisfiedBy(makeItemSnapshot({ traditions: ['primal'] }))).toBe(false);
    expect(spec.isSatisfiedBy(makeItemSnapshot({ traditions: [] }))).toBe(false);
  });

  it('price range works on gold value with null silent-exclude (priceless feats)', () => {
    const spec = new Pf2ePriceRangeSpecification(new Range(1, 50));
    expect(spec.isSatisfiedBy(makeItemSnapshot({ priceGold: 12.5 }))).toBe(true);
    expect(spec.isSatisfiedBy(makeItemSnapshot({ priceGold: 500 }))).toBe(false);
    expect(spec.isSatisfiedBy(makeItemSnapshot({ priceGold: null }))).toBe(false);
  });
});
