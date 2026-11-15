import { UnknownEffectRegistryIdError } from '../../domain';
import {
  toEffectDetails,
  toFoundryEffectDetailsCreateData,
  toFoundryEffectDetailsUpdateData
} from '../effectDetailsMapper';
import type { FoundryEffectSource } from '../foundryEffectTypes';

// Stored data as the Node probe of Foundry 13.351 / 14.368 produced it for the
// same effect (t2-items/probe-payloads.mjs), and the payloads that produced it.

const FOUNDRY_13_SOURCE: FoundryEffectSource = {
  _id: 'shield',
  name: 'Shield',
  img: 'icons/x.webp',
  disabled: false,
  transfer: true,
  description: '<p>+2 AC</p>',
  tint: '#ff8800',
  origin: 'Item.abcdefghijklmnop',
  statuses: ['shielded'],
  sort: 10,
  changes: [{ key: 'system.attributes.ac.bonus', value: '2', mode: 2, priority: 20 }],
  duration: { seconds: null, rounds: 10, turns: null },
  type: 'base',
  system: {}
};

const FOUNDRY_14_SOURCE: FoundryEffectSource = {
  _id: 'shield',
  name: 'Shield',
  img: 'icons/x.webp',
  disabled: false,
  transfer: true,
  description: '<p>+2 AC</p>',
  tint: '#ff8800',
  origin: 'Item.abcdefghijklmnop',
  statuses: ['shielded'],
  sort: 10,
  system: { changes: [{ key: 'system.attributes.ac.bonus', type: 'add', value: 2, priority: 20, phase: 'initial' }] },
  duration: { value: 10, units: 'rounds', expiry: 'turnStart', expired: false },
  type: 'base',
  showIcon: 2
};

const COMMON = {
  id: 'shield',
  name: 'Shield',
  img: 'icons/x.webp',
  type: 'base',
  disabled: false,
  transfer: true,
  description: '<p>+2 AC</p>',
  tint: '#ff8800',
  origin: 'Item.abcdefghijklmnop',
  statuses: ['shielded'],
  sort: 10,
  system: {}
};

const V13 = { unitModel: false };
const V14 = { unitModel: true };

describe('toEffectDetails', () => {
  it('reads a Foundry 13 effect: top-level changes with numeric modes, three duration fields, no icon visibility', () => {
    expect(toEffectDetails({ _source: FOUNDRY_13_SOURCE })).toEqual({
      ...COMMON,
      changes: [{ key: 'system.attributes.ac.bonus', type: 'add', value: '2', priority: 20 }],
      duration: { value: 10, units: 'rounds' }
    });
  });

  it('reads a Foundry 14 effect: changes out of the type data, one duration unit with its expiry, icon visibility', () => {
    expect(toEffectDetails({ _source: FOUNDRY_14_SOURCE })).toEqual({
      ...COMMON,
      changes: [{ key: 'system.attributes.ac.bonus', type: 'add', value: 2, priority: 20, phase: 'initial' }],
      duration: { value: 10, units: 'rounds', expiry: 'turnStart', expired: false },
      showIcon: 'always'
    });
  });

  it('keeps the rest of the Foundry 14 type data', () => {
    const effect = toEffectDetails({ _source: { ...FOUNDRY_14_SOURCE, system: { changes: [], riders: ['x'] } } });

    expect(effect.system).toEqual({ riders: ['x'] });
  });

  it.each([
    ['permanent on 14', { value: null, units: 'seconds', expiry: null, expired: false }, null],
    ['waiting for its expiry event on 14', { value: null, units: 'seconds', expiry: 'turnEnd', expired: false }, { value: null, units: 'seconds', expiry: 'turnEnd', expired: false }],
    ['in a calendar unit on 14', { value: 8, units: 'hours', expiry: 'turnStart', expired: true }, { value: 8, units: 'hours', expiry: 'turnStart', expired: true }],
    ['permanent on 13', { seconds: null, rounds: null, turns: null }, null],
    ['saved empty on 13', {}, null],
    ['in seconds on 13, which win over rounds', { seconds: 60, rounds: 10 }, { value: 60, units: 'seconds' }],
    ['in turns on 13', { turns: 2 }, { value: 2, units: 'turns' }],
    ['in rounds and turns on 13', { rounds: 2, turns: 1 }, { value: 2, units: 'rounds', extraTurns: 1 }]
  ])('reads a duration %s', (_case, duration, expected) => {
    const source = { ...FOUNDRY_13_SOURCE, duration } as FoundryEffectSource;

    expect(toEffectDetails({ _source: source }).duration).toEqual(expected);
  });

  it('names an unknown Foundry 13 mode the way Foundry 14 migrates it', () => {
    const source = { ...FOUNDRY_13_SOURCE, changes: [{ key: 'a', value: '1', mode: 7 }] };

    expect(toEffectDetails({ _source: source }).changes).toEqual([{ key: 'a', type: 'custom.7', value: '1', priority: null }]);
  });

  it('gives a sparse source the schema defaults and drops duplicate statuses', () => {
    const effect = toEffectDetails({ _source: { _id: 'e', name: 'E', statuses: ['a', 'a'] } });

    expect(effect).toEqual({
      id: 'e',
      name: 'E',
      img: null,
      type: 'base',
      disabled: false,
      transfer: false,
      description: '',
      tint: '#ffffff',
      origin: null,
      statuses: ['a'],
      sort: 0,
      changes: [],
      duration: null,
      system: {}
    });
  });
});

const DRAFT = {
  name: 'Shield',
  img: 'icons/x.webp',
  disabled: false,
  transfer: true,
  description: '<p>+2 AC</p>',
  tint: '#ff8800',
  origin: 'Item.abcdefghijklmnop',
  statuses: ['shielded'],
  sort: 10,
  changes: [{ key: 'system.attributes.ac.bonus', type: 'add', value: 2, priority: 20, phase: 'initial' }],
  duration: { value: 10, units: 'rounds' as const },
  type: 'base'
};

describe('toFoundryEffectDetailsCreateData', () => {
  it('builds the Foundry 14 payload: changes as type data, the default expiry event, icon visibility as its code', () => {
    expect(toFoundryEffectDetailsCreateData({ ...DRAFT, showIcon: 'always' }, V14)).toEqual({
      name: 'Shield',
      img: 'icons/x.webp',
      disabled: false,
      transfer: true,
      description: '<p>+2 AC</p>',
      tint: '#ff8800',
      origin: 'Item.abcdefghijklmnop',
      statuses: ['shielded'],
      sort: 10,
      system: { changes: [{ key: 'system.attributes.ac.bonus', type: 'add', value: 2, priority: 20, phase: 'initial' }] },
      duration: { value: 10, units: 'rounds', expiry: 'turnStart', expired: false },
      type: 'base',
      showIcon: 2
    });
  });

  it('builds the Foundry 13 payload: top-level changes with a mode and a string value, the unused duration fields cleared', () => {
    const draft = { ...DRAFT, changes: [{ key: 'system.attributes.ac.bonus', type: 'add', value: 2, priority: 20 }] };

    expect(toFoundryEffectDetailsCreateData(draft, V13)).toEqual({
      name: 'Shield',
      img: 'icons/x.webp',
      disabled: false,
      transfer: true,
      description: '<p>+2 AC</p>',
      tint: '#ff8800',
      origin: 'Item.abcdefghijklmnop',
      statuses: ['shielded'],
      sort: 10,
      changes: [{ key: 'system.attributes.ac.bonus', value: '2', mode: 2, priority: 20 }],
      duration: { seconds: null, rounds: 10, turns: null },
      type: 'base'
    });
  });

  it('sends only the name when nothing else is set', () => {
    expect(toFoundryEffectDetailsCreateData({ name: 'Bare' }, V14)).toEqual({ name: 'Bare' });
    expect(toFoundryEffectDetailsCreateData({ name: 'Bare' }, V13)).toEqual({ name: 'Bare' });
  });

  it('merges changes into the caller\'s type data on 14, and keeps them apart on 13', () => {
    const changes = [{ key: 'a', type: 'override', value: true }];

    expect(toFoundryEffectDetailsCreateData({ name: 'x', system: { level: 1 }, changes }, V14)).toEqual({
      name: 'x',
      system: { level: 1, changes: [{ key: 'a', type: 'override', value: true }] }
    });
    expect(toFoundryEffectDetailsCreateData({ name: 'x', system: { level: 1 }, changes }, V13)).toEqual({
      name: 'x',
      system: { level: 1 },
      changes: [{ key: 'a', value: 'true', mode: 5 }]
    });
  });

  it('refuses on 13 a change type without a mode', () => {
    expect(() => toFoundryEffectDetailsCreateData({ name: 'x', changes: [{ key: 'a', type: 'subtract', value: 1 }] }, V13)).toThrow(
      UnknownEffectRegistryIdError
    );
  });
});

describe('toFoundryEffectDetailsUpdateData', () => {
  it('sends only what changes', () => {
    expect(toFoundryEffectDetailsUpdateData({ tint: '#00ff00', origin: null, statuses: ['a', 'b'], sort: -5, description: '' }, V14)).toEqual({
      tint: '#00ff00',
      origin: null,
      statuses: ['a', 'b'],
      sort: -5,
      description: ''
    });
    expect(toFoundryEffectDetailsUpdateData({}, V13)).toEqual({});
  });

  it('makes an effect permanent: no length and no expiry event on 14, all three fields cleared on 13', () => {
    expect(toFoundryEffectDetailsUpdateData({ duration: null }, V14)).toEqual({
      duration: { value: null, units: 'seconds', expiry: null, expired: false }
    });
    expect(toFoundryEffectDetailsUpdateData({ duration: null }, V13)).toEqual({
      duration: { seconds: null, rounds: null, turns: null }
    });
  });

  it('sets a new duration with the expiry event the caller names, or none', () => {
    expect(toFoundryEffectDetailsUpdateData({ duration: { value: 3, units: 'turns', expiry: 'turnEnd' } }, V14)).toEqual({
      duration: { value: 3, units: 'turns', expiry: 'turnEnd', expired: false }
    });
    expect(toFoundryEffectDetailsUpdateData({ duration: { value: 3, units: 'turns', expiry: null } }, V14)).toEqual({
      duration: { value: 3, units: 'turns', expiry: null, expired: false }
    });
    expect(toFoundryEffectDetailsUpdateData({ duration: { value: 3, units: 'turns' } }, V13)).toEqual({
      duration: { seconds: null, rounds: null, turns: 3 }
    });
  });

  it('replaces the changes on 14 through the type data alone', () => {
    expect(toFoundryEffectDetailsUpdateData({ changes: [] }, V14)).toEqual({ system: { changes: [] } });
    expect(toFoundryEffectDetailsUpdateData({ system: { level: 2 } }, V14)).toEqual({ system: { level: 2 } });
  });
});
