import {
  toEffect,
  toFoundryEffectCreateData,
  toFoundryEffectUpdateData,
  toFoundryStatusToggleOptions,
  toStatusToggle
} from '../effectMapper';
import type { FoundryActiveEffect } from '../foundryEffectTypes';

function document(overrides: Partial<FoundryActiveEffect> = {}): FoundryActiveEffect {
  return {
    _id: 'e1',
    name: 'Bless',
    img: 'bless.webp',
    disabled: false,
    origin: 'Item.spell',
    statuses: new Set<string>(),
    changes: [],
    duration: {},
    update: jest.fn(),
    delete: jest.fn(),
    ...overrides
  };
}

describe('toEffect', () => {
  it('maps the document fields', () => {
    const effect = toEffect(
      document({
        statuses: new Set(['prone', 'restrained']),
        changes: [{ key: 'system.attributes.ac.bonus', value: '2', mode: 2 }]
      })
    );

    expect(effect).toEqual({
      id: 'e1',
      name: 'Bless',
      img: 'bless.webp',
      disabled: false,
      statuses: ['prone', 'restrained'],
      origin: 'Item.spell',
      changes: [{ key: 'system.attributes.ac.bonus', value: '2', mode: 2 }],
      duration: null
    });
  });

  it('reports an effect without an icon', () => {
    expect(toEffect(document({ img: null })).img).toBeNull();
  });

  describe('durations of Foundry 13 and older', () => {
    it('reads an effect without any duration field as permanent', () => {
      expect(toEffect(document({ duration: {} })).duration).toBeNull();
    });

    it.each([
      ['rounds', { rounds: 10 }, { rounds: 10 }],
      ['turns', { turns: 2 }, { turns: 2 }],
      ['seconds', { seconds: 600 }, { seconds: 600 }],
      ['rounds and turns', { rounds: 5, turns: 1 }, { rounds: 5, turns: 1 }]
    ])('keeps a duration in %s', (_units, duration, expected) => {
      expect(toEffect(document({ duration })).duration).toEqual(expected);
    });

    it('reads an effect whose sheet was saved with empty duration fields as permanent', () => {
      // What Foundry 13 stores then: every number the sheet shows, submitted empty, is null.
      const savedEmpty = {
        startTime: null,
        seconds: null,
        combat: null,
        rounds: null,
        turns: null,
        startRound: null,
        startTurn: null
      };

      expect(toEffect(document({ duration: savedEmpty })).duration).toBeNull();
    });

    it('reports only the fields that hold a number', () => {
      expect(toEffect(document({ duration: { seconds: null, rounds: 3, turns: null } })).duration).toEqual({ rounds: 3 });
      expect(toEffect(document({ duration: { seconds: 600, rounds: null, turns: null } })).duration).toEqual({
        seconds: 600
      });
      expect(toEffect(document({ duration: { seconds: null } })).duration).toBeNull();
    });

    it('keeps a duration of zero as a duration', () => {
      expect(toEffect(document({ duration: { seconds: null, rounds: 0, turns: null } })).duration).toEqual({ rounds: 0 });
    });
  });

  describe('durations of Foundry 14', () => {
    const PERMANENT = { value: Infinity, units: 'seconds', seconds: Infinity };

    it('reads an infinite duration as permanent', () => {
      expect(toEffect(document({ duration: PERMANENT })).duration).toBeNull();
    });

    it('reads a missing value as permanent', () => {
      expect(toEffect(document({ duration: { value: null, units: 'rounds' } })).duration).toBeNull();
    });

    it.each([
      ['rounds', { value: 3, units: 'rounds', seconds: 18 }, { rounds: 3 }],
      ['turns', { value: 2, units: 'turns', seconds: null }, { turns: 2 }],
      ['seconds', { value: 60, units: 'seconds', seconds: 60 }, { seconds: 60 }],
      ['minutes, through the seconds the core derived', { value: 10, units: 'minutes', seconds: 600 }, { seconds: 600 }]
    ])('maps a duration in %s', (_units, duration, expected) => {
      expect(toEffect(document({ duration })).duration).toEqual(expected);
    });

    it('keeps a calendar duration without a seconds value temporary, with nothing to report', () => {
      expect(toEffect(document({ duration: { value: 2, units: 'months', seconds: null } })).duration).toEqual({});
    });

    it('goes by the units, not by legacy fields that may sit next to them', () => {
      expect(toEffect(document({ duration: { value: 3, units: 'rounds', rounds: 99, turns: 99 } })).duration).toEqual({
        rounds: 3
      });
    });
  });

  describe('change values', () => {
    it('keeps a string as it is', () => {
      const [change] = toEffect(document({ changes: [{ key: 'k', value: '1d4', mode: 2 }] })).changes;

      expect(change?.value).toBe('1d4');
    });

    it.each([
      ['a number', 1, '1'],
      ['a boolean', true, 'true'],
      ['an object', { bonus: 2 }, '{"bonus":2}'],
      ['null', null, 'null'],
      ['a missing value', undefined, '']
    ])('turns %s into a string', (_case, value, expected) => {
      const [change] = toEffect(document({ changes: [{ key: 'k', value, mode: 5 }] })).changes;

      expect(change).toEqual({ key: 'k', value: expected, mode: 5 });
    });
  });
});

describe('toStatusToggle', () => {
  it('reads a created effect as "now active", with its id', () => {
    expect(toStatusToggle({ _id: 'new' })).toEqual({ active: true, effectId: 'new' });
  });

  it('reads true as "already active"', () => {
    expect(toStatusToggle(true)).toEqual({ active: true, effectId: null });
  });

  it('reads false and undefined as "not active"', () => {
    expect(toStatusToggle(false)).toEqual({ active: false, effectId: null });
    expect(toStatusToggle(undefined)).toEqual({ active: false, effectId: null });
  });
});

describe('toFoundryStatusToggleOptions', () => {
  it('gives the core no options object when none is set', () => {
    expect(toFoundryStatusToggleOptions({})).toBeUndefined();
    expect(toFoundryStatusToggleOptions({ active: undefined, overlay: undefined })).toBeUndefined();
  });

  it('carries only the options that are set', () => {
    expect(toFoundryStatusToggleOptions({ active: false })).toEqual({ active: false });
    expect(toFoundryStatusToggleOptions({ overlay: true })).toEqual({ overlay: true });
    expect(toFoundryStatusToggleOptions({ active: true, overlay: true })).toEqual({ active: true, overlay: true });
  });
});

describe('effect document data', () => {
  it('builds a new effect from the attributes that are set', () => {
    const data = toFoundryEffectCreateData({ name: 'Haste', disabled: false, statuses: ['hasted'] });

    expect(data).toEqual({ name: 'Haste', disabled: false, statuses: ['hasted'] });
    expect(data).not.toHaveProperty('img');
    expect(data).not.toHaveProperty('duration');
  });

  it('hands changes and duration to the core exactly as given', () => {
    const changes = [{ key: 'system.attributes.ac.bonus', value: 2, type: 'add', priority: 20 }];
    const duration = { value: 3, units: 'rounds' };

    const data = toFoundryEffectCreateData({ name: 'Shield', changes, duration, origin: null, img: null });

    expect(data['changes']).toBe(changes);
    expect(data['duration']).toBe(duration);
    expect(data).toMatchObject({ origin: null, img: null });
  });

  it('builds an update from the attributes that are set, and an empty one from none', () => {
    expect(toFoundryEffectUpdateData({ name: 'Bless II', disabled: true })).toEqual({ name: 'Bless II', disabled: true });
    expect(toFoundryEffectUpdateData({})).toEqual({});
  });
});
