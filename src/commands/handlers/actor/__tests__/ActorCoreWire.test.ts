import type { ActorGameProvider } from '../../../../core/actors';
import { createCreateActorHandler } from '../CreateActorHandler';
import { createGetActorHandler } from '../GetActorHandler';
import { createGetActorsHandler } from '../GetActorsHandler';
import { createUpdateActorHandler } from '../UpdateActorHandler';

// Wire details of the actor commands that the pre-migration tests leave open.

interface FakeActor {
  id: string;
  uuid: string;
  name: string;
  type: string;
  img: string | null;
  folder: { name: string } | null;
  update: jest.Mock;
}

function fakeActor(overrides: Partial<FakeActor> = {}): FakeActor {
  return {
    id: 'a1',
    uuid: 'Actor.a1',
    name: 'Goblin',
    type: 'npc',
    img: 'goblin.webp',
    folder: null,
    update: jest.fn().mockResolvedValue(undefined),
    ...overrides
  };
}

function provider(game: unknown): ActorGameProvider {
  return { getGame: () => game } as unknown as ActorGameProvider;
}

describe('actor commands on the wire', () => {
  describe('update-actor addressed through a token', () => {
    const tokenActor = fakeActor({ name: 'Goblin 3' });
    const cave = { id: 'cave', tokens: { get: (id: string) => (id === 't3' ? { id: 't3', actor: tokenActor } : undefined) } };

    it.each([
      ['undefined, as the core reports it', undefined],
      ['null', null]
    ])('answers exactly "No active scene" when the active scene is %s', async (_case, active) => {
      const handler = createUpdateActorHandler({
        gameProvider: provider({ actors: { get: jest.fn() }, scenes: { get: jest.fn(), active } })
      });

      await expect(handler({ tokenId: 't3', name: 'x' })).rejects.toMatchObject({ message: 'No active scene' });
    });

    it('answers exactly the legacy texts for a scene, a token or an actor that is not there', async () => {
      const handler = createUpdateActorHandler({
        gameProvider: provider({
          actors: { get: () => undefined },
          scenes: { get: (id: string) => (id === 'cave' ? cave : undefined), active: cave }
        })
      });

      await expect(handler({ tokenId: 't3', sceneId: 'nope' })).rejects.toMatchObject({ message: 'Scene not found: nope' });
      await expect(handler({ tokenId: 'zz' })).rejects.toMatchObject({ message: 'Token not found: zz' });
      await expect(handler({ actorId: 'zz' })).rejects.toMatchObject({ message: 'Actor not found: zz' });
      await expect(handler({ name: 'x' })).rejects.toMatchObject({ message: 'Either actorId or tokenId is required' });
    });

    it('reads an empty sceneId as a scene id, not as the active scene', async () => {
      const handler = createUpdateActorHandler({
        gameProvider: provider({ actors: { get: jest.fn() }, scenes: { get: () => undefined, active: cave } })
      });

      await expect(handler({ tokenId: 't3', sceneId: '' })).rejects.toMatchObject({ message: 'Scene not found: ' });
    });
  });

  describe('the actor image', () => {
    const imageless = fakeActor({ img: null });

    it('is reported as stored by write results', async () => {
      const create = jest.fn().mockResolvedValue(imageless);
      const game = { actors: { get: () => imageless, documentClass: { create } } };

      const created = await createCreateActorHandler({ gameProvider: provider(game) })({ name: 'Goblin', type: 'npc' });
      const updated = await createUpdateActorHandler({ gameProvider: provider(game) })({ actorId: 'a1', name: 'Goblin' });

      expect(created.img).toBeNull();
      expect(updated.img).toBeNull();
    });

    it('is reported as an empty string by read results', async () => {
      const detailed = { ...imageless, getRollData: () => ({}), items: { forEach: () => undefined } };
      const game = {
        actors: { get: () => detailed, forEach: (fn: (actor: unknown) => void) => { fn(imageless); } }
      };

      const listed = await createGetActorsHandler({ gameProvider: provider(game) })({});
      const read = await createGetActorHandler({ gameProvider: provider(game) })({ actorId: 'a1' });

      expect(listed[0]?.img).toBe('');
      expect(read.img).toBe('');
    });
  });

  describe('update-actor address fields the target does not need', () => {
    it('ignores a stray sceneId next to an actorId', async () => {
      const goblin = fakeActor();
      const handler = createUpdateActorHandler({ gameProvider: provider({ actors: { get: () => goblin } }) });

      const result = await handler({ actorId: 'a1', sceneId: null, name: 'Boss' } as unknown as Parameters<typeof handler>[0]);

      expect(goblin.update).toHaveBeenCalledWith({ name: 'Boss' });
      expect(result).not.toHaveProperty('tokenId');
    });

    it('ignores a stray actorId next to a tokenId', async () => {
      const tokenActor = fakeActor({ name: 'Goblin 3' });
      const cave = { id: 'cave', tokens: { get: () => ({ id: 't3', actor: tokenActor }) } };
      const getActor = jest.fn();
      const handler = createUpdateActorHandler({
        gameProvider: provider({ actors: { get: getActor }, scenes: { get: jest.fn(), active: cave } })
      });

      const result = await handler({ actorId: null, tokenId: 't3', name: 'Boss' } as unknown as Parameters<typeof handler>[0]);

      expect(tokenActor.update).toHaveBeenCalledWith({ name: 'Boss' });
      expect(getActor).not.toHaveBeenCalled();
      expect(result.tokenId).toBe('t3');
    });
  });

  it('get-actors does not look at its parameters at all', async () => {
    const handler = createGetActorsHandler({ gameProvider: provider({ actors: { forEach: () => undefined } }) });

    await expect(handler(undefined as unknown as Record<string, never>)).resolves.toEqual([]);
  });

  it('update-actor sends an empty update when nothing but the target is given', async () => {
    const goblin = fakeActor();
    const handler = createUpdateActorHandler({ gameProvider: provider({ actors: { get: () => goblin } }) });

    await handler({ actorId: 'a1' });

    expect(goblin.update).toHaveBeenCalledWith({});
  });

  it('ignores keys the command does not know', async () => {
    const goblin = fakeActor();
    const handler = createUpdateActorHandler({ gameProvider: provider({ actors: { get: () => goblin } }) });

    await handler({ actorId: 'a1', name: 'Boss', hp: 5 } as unknown as Parameters<typeof handler>[0]);

    expect(goblin.update).toHaveBeenCalledWith({ name: 'Boss' });
  });
});
