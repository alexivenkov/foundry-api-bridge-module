import { FoundryEffectStore } from '../FoundryEffectStore';
import { withoutMaskingZeroUnits } from '../effectMapper';
import type { FoundryEffectGame } from '../foundryEffectTypes';

// What Foundry 14.368 stores for each duration, through BaseActiveEffect in Node
// (t2-items/probe-multiunit.mjs): as given, and with the masking zero dropped.
//   { rounds: 10, turns: 0 }          given → 0 turns     dropped → 10 rounds
//   { seconds: 0, rounds: 10 }        given → 0 seconds   dropped → 10 rounds
//   { seconds: 0, rounds: 0, turns: 2 } given → 0 seconds dropped → 2 turns
//   { seconds: 60, rounds: 10 }, { rounds: 10, turns: 1 }, { turns: 0 }, { rounds: 0, turns: 0 }: unchanged

describe('withoutMaskingZeroUnits', () => {
  it.each([
    [{ rounds: 10, turns: 0 }, { rounds: 10 }],
    [{ seconds: 0, rounds: 10 }, { rounds: 10 }],
    [{ seconds: 0, rounds: 0, turns: 2, startTime: 5 }, { turns: 2, startTime: 5 }]
  ])('drops a zero unit next to a positive one: %j', (duration, expected) => {
    expect(withoutMaskingZeroUnits(duration)).toEqual(expected);
  });

  it.each([
    [{ seconds: 60, rounds: 10 }],
    [{ rounds: 10, turns: 1 }],
    [{ turns: 0 }],
    [{ rounds: 0, turns: 0 }],
    [{ rounds: 10, turns: null }],
    [{ value: 0, units: 'turns', rounds: 10 }]
  ])('leaves a duration with nothing to unmask as given: %j', (duration) => {
    expect(withoutMaskingZeroUnits(duration)).toBe(duration);
  });
});

describe('FoundryEffectStore, durations in several units', () => {
  function storeOn(generation: number): { store: FoundryEffectStore; create: jest.Mock; update: jest.Mock } {
    const create = jest.fn().mockResolvedValue([{ _id: 'e', name: 'x' }]);
    const update = jest.fn().mockResolvedValue(undefined);
    const effect = { _id: 'bless', name: 'Bless', update, delete: jest.fn() };
    const hero = {
      id: 'a1',
      name: 'Hero',
      effects: { contents: [effect], get: (id: string) => (id === 'bless' ? effect : undefined) },
      statuses: new Set<string>(),
      toggleStatusEffect: jest.fn(),
      createEmbeddedDocuments: create
    };
    const game = { actors: { get: () => hero }, scenes: { get: () => undefined, active: null } };
    const store = new FoundryEffectStore({ getGame: () => game as unknown as FoundryEffectGame }, () => generation);
    return { store, create, update };
  }
  const HERO = { kind: 'world', actorId: 'a1' } as const;

  it('drops the masking zero on Foundry 14, on create and on update', async () => {
    const { store, create, update } = storeOn(14);

    await store.createEffect(HERO, { name: 'x', duration: { rounds: 10, turns: 0 } });
    await store.updateEffect(HERO, 'bless', { duration: { seconds: 0, rounds: 3 } });

    expect(create).toHaveBeenCalledWith('ActiveEffect', [{ name: 'x', duration: { rounds: 10 } }]);
    expect(update).toHaveBeenCalledWith({ duration: { rounds: 3 } });
  });

  it.each([13, 0])('hands the duration over as given on generation %i', async (generation) => {
    const { store, create, update } = storeOn(generation);

    await store.createEffect(HERO, { name: 'x', duration: { rounds: 10, turns: 0 } });
    await store.updateEffect(HERO, 'bless', { name: 'y' });

    expect(create).toHaveBeenCalledWith('ActiveEffect', [{ name: 'x', duration: { rounds: 10, turns: 0 } }]);
    expect(update).toHaveBeenCalledWith({ name: 'y' });
  });
});
