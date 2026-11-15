import { toFoundryEffectCreateData, toFoundryEffectUpdateData } from '../effectMapper';

// The attributes `add-actor-effect` / `update-actor-effect` gained; the payloads
// were pushed through BaseActiveEffect of Foundry 13.351 and 14.368 in Node.

describe('effect write data, added attributes', () => {
  it('sends a subtype, type data, description, sort and icon visibility on create', () => {
    expect(
      toFoundryEffectCreateData({
        name: 'Bless',
        type: 'enchantment',
        system: {},
        description: '<p>d</p>',
        sort: 3,
        showIcon: 'never'
      })
    ).toEqual({ name: 'Bless', type: 'enchantment', system: {}, description: '<p>d</p>', sort: 3, showIcon: 0 });
  });

  it('sends tint, origin, statuses and the other new attributes on update', () => {
    expect(
      toFoundryEffectUpdateData({
        tint: '#00ff00',
        origin: null,
        statuses: ['a', 'b'],
        sort: -5,
        description: '',
        showIcon: 'conditional',
        system: { level: 2 }
      })
    ).toEqual({
      tint: '#00ff00',
      origin: null,
      statuses: ['a', 'b'],
      sort: -5,
      description: '',
      showIcon: 1,
      system: { level: 2 }
    });
  });

  it('still sends nothing that is not set', () => {
    expect(toFoundryEffectCreateData({ name: 'x' })).toEqual({ name: 'x' });
    expect(toFoundryEffectUpdateData({})).toEqual({});
  });
});
