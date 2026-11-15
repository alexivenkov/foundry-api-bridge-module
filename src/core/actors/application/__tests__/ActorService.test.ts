import {
  ActorNotFoundError,
  NoActiveSceneError,
  SceneNotFoundError,
  TargetTokenNotFoundError,
  TokenHasNoActorError
} from '../../../shared';
import { ActorCreationCancelledError, type ActorDetails } from '../../domain';
import { ActorService } from '../ActorService';
import { FakeActorStore, FakeWorld } from './fakePorts';

const goblin: ActorDetails = {
  id: 'a1',
  name: 'Goblin',
  type: 'npc',
  img: 'goblin.webp',
  rollData: { attributes: { hp: { value: 7 } } },
  items: [{ id: 'i1', name: 'Scimitar', type: 'weapon', img: null, system: { damage: '1d6' } }]
};

function setup(): { service: ActorService; store: FakeActorStore; world: FakeWorld } {
  const store = new FakeActorStore([goblin]);
  const world = new FakeWorld([{ id: 'a1', name: 'Goblin' }], {
    t3: { id: 'a1', name: 'Goblin 3' },
    empty: null
  });
  return { service: new ActorService({ scenes: world, locator: world, actors: store }), store, world };
}

describe('ActorService', () => {
  describe('reading', () => {
    it('lists the actors of the world', () => {
      expect(setup().service.listActors()).toEqual([{ id: 'a1', name: 'Goblin', type: 'npc', img: 'goblin.webp' }]);
    });

    it('returns an actor with its roll data and items', () => {
      expect(setup().service.getActor({ actorId: 'a1' })).toBe(goblin);
    });

    it('rejects an unknown actor', () => {
      const act = (): ActorDetails => setup().service.getActor({ actorId: 'zz' });

      expect(act).toThrow(ActorNotFoundError);
      expect(act).toThrow('Actor not found: zz');
    });
  });

  describe('createActor', () => {
    it('creates the actor from the draft', async () => {
      const { service, store } = setup();
      const draft = { name: 'Orc', type: 'npc', folderId: 'f1', system: { cr: 1 } };

      const created = await service.createActor({ draft });

      expect(store.created).toEqual([draft]);
      expect(created).toMatchObject({ id: 'created', name: 'Orc', type: 'npc' });
    });

    it('fails when the core created nothing', async () => {
      const { service, store } = setup();
      store.createsNothing = true;

      const creation = service.createActor({ draft: { name: 'Orc', type: 'npc' } });

      await expect(creation).rejects.toThrow(ActorCreationCancelledError);
      await expect(creation).rejects.toThrow(
        'Actor creation was cancelled by Foundry (a module hook may have vetoed it)'
      );
    });
  });

  describe('updateActor', () => {
    it('updates a world actor addressed by id', async () => {
      const { service, store } = setup();

      const result = await service.updateActor({
        target: { kind: 'actor', actorId: 'a1' },
        changes: { name: 'Goblin Boss' }
      });

      expect(store.updated).toEqual([{ ref: { kind: 'world', actorId: 'a1' }, changes: { name: 'Goblin Boss' } }]);
      expect(result.actor.name).toBe('Goblin Boss');
      expect(result.tokenId).toBeUndefined();
    });

    it("updates one token's own actor and names the token", async () => {
      const { service, store } = setup();

      const result = await service.updateActor({
        target: { kind: 'token', tokenId: 't3', sceneId: undefined },
        changes: { system: { attributes: { hp: { value: 3 } } } }
      });

      expect(store.updated[0]?.ref).toEqual({ kind: 'token', sceneId: 'cave', tokenId: 't3' });
      expect(result.tokenId).toBe('t3');
    });

    it('still asks the core for an update that changes nothing', async () => {
      const { service, store } = setup();

      await service.updateActor({ target: { kind: 'actor', actorId: 'a1' }, changes: {} });

      expect(store.updated).toHaveLength(1);
    });

    it('rejects a target that leads to no actor, and updates nothing', async () => {
      const { service, store, world } = setup();
      const update = (target: Parameters<ActorService['updateActor']>[0]['target']): Promise<unknown> =>
        service.updateActor({ target, changes: { name: 'x' } });

      await expect(update({ kind: 'actor', actorId: 'zz' })).rejects.toThrow(ActorNotFoundError);
      await expect(update({ kind: 'token', tokenId: 'zz', sceneId: undefined })).rejects.toThrow(TargetTokenNotFoundError);
      await expect(update({ kind: 'token', tokenId: 'empty', sceneId: undefined })).rejects.toThrow(TokenHasNoActorError);
      await expect(update({ kind: 'token', tokenId: 't3', sceneId: 'missing' })).rejects.toThrow(SceneNotFoundError);

      world.activeSceneId = null;
      await expect(update({ kind: 'token', tokenId: 't3', sceneId: undefined })).rejects.toThrow(NoActiveSceneError);

      expect(store.updated).toEqual([]);
    });
  });

  describe('deleteActor', () => {
    it('deletes a world actor', async () => {
      const { service, store } = setup();

      await service.deleteActor({ actorId: 'a1' });

      expect(store.deleted).toEqual(['a1']);
    });

    it('rejects an unknown actor without touching the store', async () => {
      const { service, store } = setup();

      await expect(service.deleteActor({ actorId: 'zz' })).rejects.toThrow('Actor not found: zz');
      expect(store.deleted).toEqual([]);
    });
  });
});
