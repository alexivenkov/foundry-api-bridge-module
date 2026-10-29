import { makeActor, makeTraitRoll, makeUser } from '@/systems/swade/shared/__tests__/swadeTestFixtures';

const mockGame = {
  system: { id: 'swade' },
  actors: { get: jest.fn() },
  scenes: { get: jest.fn(), active: { id: 's1', tokens: { get: jest.fn() } } },
  settings: { get: jest.fn() },
  user: makeUser({ isGM: true, bennies: 2 }),
  swade: { dice: {} }
};

(globalThis as Record<string, unknown>)['game'] = mockGame;

import { swadeApplyDamageHandler } from '../SwadeApplyDamageHandler';
import { swadeSoakHandler } from '../SwadeSoakHandler';
import { swadeBenniesHandler } from '../SwadeBenniesHandler';
import { swadeGetActorSummaryHandler } from '../SwadeGetActorSummaryHandler';

describe('SWADE damage, soak, bennies and summary handlers (swade world)', () => {
  let actor = makeActor();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGame.system.id = 'swade';
    mockGame.settings.get.mockReturnValue(false);
    actor = makeActor({ roll: makeTraitRoll({ dice: [{ faces: 8, results: [8, 1] }] }) });
    mockGame.actors.get.mockImplementation((id: string) => (id === 'a1' ? actor : undefined));
    mockGame.scenes.active.tokens.get.mockImplementation((id: string) => (id === 't1' ? { id: 't1', name: 'Hero', actor } : undefined));
  });

  it('swade/apply-damage applies the rule and reports the preview with before/after state', async () => {
    const result = await swadeApplyDamageHandler({ tokenId: 't1', damage: 12, ap: 1 });

    expect(result).toEqual({
      actorId: 'a1',
      tokenId: 't1',
      toughness: 7,
      armor: 2,
      apApplied: 1,
      effectiveToughness: 6,
      excess: 6,
      outcome: 'wounded',
      woundsInflicted: 1,
      doubleShaken: false,
      wouldIncapacitate: false,
      applied: true,
      shakenBefore: false,
      shakenAfter: true,
      woundsBefore: 0,
      woundsAfter: 1,
      woundsMax: 3,
      incapacitated: false,
      canSoak: true
    });
  });

  it('swade/soak rolls Vigor, spends the benny and reports the roll', async () => {
    actor.system.wounds = { value: 1, max: 3, ignored: 0 };
    actor.statuses.add('shaken');
    const result = await swadeSoakHandler({ actorId: 'a1', wounds: 1 });

    expect(result).toMatchObject({ actorId: 'a1', woundsSoaked: 1, woundsRemaining: 0, woundsAfter: 0, bennySpent: true, benniesLeft: 2, shakenRemoved: true });
    expect(result.roll).toMatchObject({ trait: 'vigor', successes: 2, total: 9 });
  });

  it('swade/bennies works for an actor and for the GM', async () => {
    expect(await swadeBenniesHandler({ actorId: 'a1', action: 'spend' })).toEqual({ owner: 'actor', actorId: 'a1', action: 'spend', before: 3, after: 2, max: 3 });
    expect(await swadeBenniesHandler({ gm: true, action: 'give' })).toEqual({ owner: 'gm', action: 'give', before: 2, after: 3 });
    await expect(swadeBenniesHandler({ action: 'spend' })).rejects.toThrow('Either actorId, tokenId or gm: true is required');
  });

  it('swade/get-actor-summary returns the normalized sheet', async () => {
    const result = await swadeGetActorSummaryHandler({ actorId: 'a1' });
    expect(result).toMatchObject({ actorId: 'a1', type: 'character', wildcard: true, derived: { parry: 6, toughness: 7, armor: 2 }, bennies: { value: 3, max: 3 } });
    expect(result.status.active).toEqual([]);
  });

  describe('system mismatch guard', () => {
    it.each([
      ['swade/apply-damage', (): Promise<unknown> => swadeApplyDamageHandler({ actorId: 'a1', damage: 5 })],
      ['swade/soak', (): Promise<unknown> => swadeSoakHandler({ actorId: 'a1', wounds: 1 })],
      ['swade/bennies', (): Promise<unknown> => swadeBenniesHandler({ actorId: 'a1', action: 'give' })],
      ['swade/get-actor-summary', (): Promise<unknown> => swadeGetActorSummaryHandler({ actorId: 'a1' })]
    ])('%s rejects in a dnd5e world', async (operation, invoke) => {
      mockGame.system.id = 'dnd5e';
      await expect(invoke()).rejects.toThrow(`Operation '${operation}' is not supported by game system 'dnd5e'`);
    });
  });
});
