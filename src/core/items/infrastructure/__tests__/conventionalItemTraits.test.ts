import { readConventionalItemTraits, type FoundryItemWithConventionalSystem } from '../conventionalItemTraits';

describe('readConventionalItemTraits', () => {
  it('reads the dnd5e item layout', () => {
    const item: FoundryItemWithConventionalSystem = {
      system: {
        equipped: true,
        quantity: 3,
        activities: { contents: [{ type: 'attack' }, { type: 'save' }] },
        description: { value: '<p>A versatile sword.</p>' },
        damage: { base: { formula: '1d8+3', types: ['slashing'] } },
        range: { reach: 5, units: 'ft' }
      }
    };

    expect(readConventionalItemTraits(item)).toEqual({
      equipped: true,
      quantity: 3,
      activityTypes: ['attack', 'save'],
      description: '<p>A versatile sword.</p>',
      damage: { base: { formula: '1d8+3', types: ['slashing'] } },
      range: { reach: 5, units: 'ft' }
    });
  });

  it('gives a system without these fields the defaults', () => {
    expect(readConventionalItemTraits({ system: {} })).toEqual({
      equipped: false,
      quantity: 1,
      activityTypes: [],
      description: '',
      damage: null,
      range: null
    });
  });

  it('reads a description without a value as empty', () => {
    expect(readConventionalItemTraits({ system: { description: {} } }).description).toBe('');
  });

  it('keeps an unequipped item and a zero quantity as they are', () => {
    const traits = readConventionalItemTraits({ system: { equipped: false, quantity: 0 } });

    expect(traits.equipped).toBe(false);
    expect(traits.quantity).toBe(0);
  });

  it('reports a value of another shape as stored, without converting it', () => {
    const carried = { carryType: 'worn', handsHeld: 0 };
    const pf2eItem = { system: { equipped: carried } } as unknown as FoundryItemWithConventionalSystem;

    expect(readConventionalItemTraits(pf2eItem).equipped).toBe(carried);
  });
});
