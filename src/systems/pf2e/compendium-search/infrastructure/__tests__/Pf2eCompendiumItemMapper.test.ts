import { Pf2eCompendiumItemMapper } from '../Pf2eCompendiumItemMapper';
import type { Pf2eCompendiumDocument } from '../foundryCompendiumPackTypes';

const mapper = new Pf2eCompendiumItemMapper();

function makeDoc(
  system: Record<string, unknown>,
  overrides: Partial<Pf2eCompendiumDocument> = {}
): Pf2eCompendiumDocument {
  return {
    id: 'i1',
    uuid: 'Compendium.pf2e.equipment-srd.Item.i1',
    name: 'Longsword',
    type: 'weapon',
    system,
    ...overrides
  };
}

describe('Pf2eCompendiumItemMapper', () => {
  it('maps the verified pf2e 7.x paths for a spell', () => {
    const snapshot = mapper.toSnapshot(
      makeDoc(
        {
          level: { value: 3 },
          traits: {
            value: ['concentrate', 'manipulate'],
            rarity: 'common',
            traditions: ['arcane', 'primal']
          }
        },
        { type: 'spell', name: 'Fireball' }
      ),
      'pf2e.spells-srd'
    );

    expect(snapshot.level).toBe(3);
    expect(snapshot.traditions).toEqual(['arcane', 'primal']);
    expect(snapshot.rarity).toBe('common');
    expect(snapshot.priceGold).toBeNull();
  });

  it('reads feat category from system.category with featType.value legacy fallback', () => {
    expect(
      mapper.toSnapshot(makeDoc({ category: 'class' }), 'p').category
    ).toBe('class');
    expect(
      mapper.toSnapshot(makeDoc({ featType: { value: 'skill' } }), 'p').category
    ).toBe('skill');
    expect(mapper.toSnapshot(makeDoc({}), 'p').category).toBeNull();
  });

  it('normalizes the partial coins price object to gold', () => {
    expect(
      mapper.toSnapshot(
        makeDoc({ price: { value: { pp: 1, gp: 2, sp: 5, cp: 10 } } }),
        'p'
      ).priceGold
    ).toBeCloseTo(12.6);
    expect(
      mapper.toSnapshot(makeDoc({ price: { value: { gp: 15 } } }), 'p').priceGold
    ).toBe(15);
    expect(
      mapper.toSnapshot(makeDoc({ price: { value: {} } }), 'p').priceGold
    ).toBe(0);
  });

  it('returns null price when the price object is missing or malformed', () => {
    expect(mapper.toSnapshot(makeDoc({}), 'p').priceGold).toBeNull();
    expect(
      mapper.toSnapshot(makeDoc({ price: { value: 'expensive' } }), 'p').priceGold
    ).toBeNull();
    expect(
      mapper.toSnapshot(makeDoc({ price: { value: { gp: 'ten' } } }), 'p').priceGold
    ).toBe(0);
  });

  it('degrades missing fields to null/[]', () => {
    const snapshot = mapper.toSnapshot(makeDoc({}), 'p');
    expect(snapshot.level).toBeNull();
    expect(snapshot.traits).toEqual([]);
    expect(snapshot.traditions).toEqual([]);
    expect(snapshot.rarity).toBeNull();
  });
});
