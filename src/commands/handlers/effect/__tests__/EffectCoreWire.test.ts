import type { EffectGameProvider } from '../../../../core/effects';
import { createAddActorEffectHandler } from '../AddActorEffectHandler';
import { createGetActorEffectsHandler } from '../GetActorEffectsHandler';
import { createRemoveActorEffectHandler } from '../RemoveActorEffectHandler';
import { createToggleActorStatusHandler } from '../ToggleActorStatusHandler';
import { createUpdateActorEffectHandler } from '../UpdateActorEffectHandler';

// Wire details of the effect commands that the pre-migration tests leave open.

function provider(game: unknown): EffectGameProvider {
  return { getGame: () => game } as unknown as EffectGameProvider;
}

function heroGame(): { game: unknown; create: jest.Mock; effects: unknown[] } {
  const create = jest.fn().mockResolvedValue([{ _id: 'new', name: 'Shield' }]);
  const effects: unknown[] = [];
  const hero = {
    id: 'a1',
    name: 'Hero',
    effects: { contents: effects, get: () => undefined },
    statuses: new Set<string>(),
    toggleStatusEffect: jest.fn(),
    createEmbeddedDocuments: create
  };
  return { game: { actors: { get: (id: string) => (id === 'a1' ? hero : undefined) } }, create, effects };
}

describe('effect commands on the wire', () => {
  describe('a token target without an active scene', () => {
    it.each([
      ['undefined, as the core reports it', undefined],
      ['null', null]
    ])('answers exactly "No active scene" from every command when the active scene is %s', async (_case, active) => {
      const deps = { gameProvider: provider({ actors: { get: jest.fn() }, scenes: { get: jest.fn(), active } }) };
      const noScene = { message: 'No active scene' };

      await expect(createGetActorEffectsHandler(deps)({ tokenId: 't3' })).rejects.toMatchObject(noScene);
      await expect(createToggleActorStatusHandler(deps)({ tokenId: 't3', statusId: 'prone' })).rejects.toMatchObject(noScene);
      await expect(createAddActorEffectHandler(deps)({ tokenId: 't3', name: 'x' })).rejects.toMatchObject(noScene);
      await expect(createUpdateActorEffectHandler(deps)({ tokenId: 't3', effectId: 'e1' })).rejects.toMatchObject(noScene);
      await expect(createRemoveActorEffectHandler(deps)({ tokenId: 't3', effectId: 'e1' })).rejects.toMatchObject(noScene);
    });
  });

  it('ignores a stray sceneId next to an actorId', async () => {
    const handler = createGetActorEffectsHandler({ gameProvider: provider(heroGame().game) });

    const result = await handler({ actorId: 'a1', sceneId: null } as unknown as Parameters<typeof handler>[0]);

    expect(result.actorName).toBe('Hero');
  });

  it('get-actor-effects rejects with an Error object', async () => {
    const handler = createGetActorEffectsHandler({ gameProvider: provider(heroGame().game) });

    await expect(handler({ actorId: 'zz' })).rejects.toBeInstanceOf(Error);
    await expect(handler({})).rejects.toMatchObject({ message: 'Either actorId or tokenId is required' });
  });

  it('get-actor-effects reads a null includeDisabled as the default', async () => {
    const { game, effects } = heroGame();
    effects.push({
      _id: 'e1',
      name: 'Shield of Faith',
      img: null,
      disabled: true,
      origin: null,
      statuses: new Set<string>(),
      changes: [],
      duration: {}
    });
    const handler = createGetActorEffectsHandler({ gameProvider: provider(game) });

    const result = await handler({ actorId: 'a1', includeDisabled: null } as unknown as Parameters<typeof handler>[0]);

    expect(result.effects).toHaveLength(1);
    expect(result.effects[0]?.img).toBeNull();
  });

  it('get-actor-effects reports an effect saved with empty duration fields as permanent', async () => {
    const { game, effects } = heroGame();
    effects.push({
      _id: 'e1',
      name: 'Blessed',
      img: 'bless.webp',
      disabled: false,
      origin: null,
      statuses: new Set<string>(),
      changes: [],
      duration: { startTime: null, seconds: null, combat: null, rounds: null, turns: null, startRound: null, startTurn: null }
    });
    const handler = createGetActorEffectsHandler({ gameProvider: provider(game) });

    const result = await handler({ actorId: 'a1' });

    expect(result.effects[0]?.isTemporary).toBe(false);
    expect(result.effects[0]).not.toHaveProperty('duration');
  });

  it('add-actor-effect hands changes and duration to the core with every key they came with', async () => {
    const { game, create } = heroGame();
    const handler = createAddActorEffectHandler({ gameProvider: provider(game) });
    const changes = [{ key: 'system.attributes.ac.bonus', value: 2, type: 'add', priority: 20 }];
    const duration = { value: 3, units: 'rounds' };

    await handler({ actorId: 'a1', name: 'Shield', changes, duration } as unknown as Parameters<typeof handler>[0]);

    expect(create).toHaveBeenCalledWith('ActiveEffect', [{ name: 'Shield', changes, duration }]);
  });

  it('ignores keys the command does not know', async () => {
    const { game, create } = heroGame();
    const handler = createAddActorEffectHandler({ gameProvider: provider(game) });

    await handler({ actorId: 'a1', name: 'Shield', tint: '#ff0000' } as unknown as Parameters<typeof handler>[0]);

    expect(create).toHaveBeenCalledWith('ActiveEffect', [{ name: 'Shield' }]);
  });
});
