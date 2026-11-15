import { isTemporary, type Effect } from '../model/Effect';

function effect(overrides: Partial<Effect> = {}): Effect {
  return {
    id: 'e1',
    name: 'Bless',
    img: 'bless.webp',
    disabled: false,
    statuses: [],
    origin: null,
    changes: [],
    duration: null,
    ...overrides
  };
}

describe('isTemporary', () => {
  it('is false for an effect without a duration', () => {
    expect(isTemporary(effect())).toBe(false);
  });

  it('is true for an effect that lasts a number of rounds', () => {
    expect(isTemporary(effect({ duration: { rounds: 10 } }))).toBe(true);
  });

  it('is true for a duration that cannot be expressed in seconds, rounds or turns', () => {
    expect(isTemporary(effect({ duration: {} }))).toBe(true);
  });
});
