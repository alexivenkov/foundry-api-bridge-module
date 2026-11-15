import {
  ActorNotFoundError,
  NoActiveSceneError,
  TargetTokenNotFoundError,
  TokenHasNoActorError,
  type ActorTarget
} from '../../../shared';
import { EffectCreationFailedError, EffectNotFoundError } from '../../domain';
import { EffectService } from '../EffectService';
import { FakeEffectEnvironment, FakeEffectStore, FakeWorld, effect } from './fakePorts';

const hero: ActorTarget = { kind: 'actor', actorId: 'a1' };
const goblinThree: ActorTarget = { kind: 'token', tokenId: 't3', sceneId: undefined };

function setup(): { service: EffectService; store: FakeEffectStore; world: FakeWorld } {
  const store = new FakeEffectStore(
    {
      'world:a1': [
        effect({ id: 'bless', name: 'Bless', duration: { rounds: 10 } }),
        effect({ id: 'shield', name: 'Shield of Faith', disabled: true })
      ],
      'token:cave:t3': [effect({ id: 'prone', name: 'Prone', statuses: ['prone'] })]
    },
    { 'world:a1': ['blessed'], 'token:cave:t3': ['prone'] }
  );
  const world = new FakeWorld([{ id: 'a1', name: 'Hero' }], { t3: { id: 'g1', name: 'Goblin 3' }, empty: null });
  return {
    service: new EffectService({ scenes: world, actors: world, effects: store, environment: new FakeEffectEnvironment() }),
    store,
    world
  };
}

describe('EffectService', () => {
  describe('listEffects', () => {
    it('lists the effects and active statuses of a world actor', () => {
      const result = setup().service.listEffects({ target: hero, includeDisabled: true });

      expect(result.actor).toEqual({ id: 'a1', name: 'Hero' });
      expect(result.effects.map((e) => e.id)).toEqual(['bless', 'shield']);
      expect(result.activeStatuses).toEqual(['blessed']);
    });

    it('leaves disabled effects out on request', () => {
      const result = setup().service.listEffects({ target: hero, includeDisabled: false });

      expect(result.effects.map((e) => e.id)).toEqual(['bless']);
    });

    it("lists one token's own effects, reported under the token actor's identity", () => {
      const result = setup().service.listEffects({ target: goblinThree, includeDisabled: true });

      expect(result.actor).toEqual({ id: 'g1', name: 'Goblin 3' });
      expect(result.effects.map((e) => e.id)).toEqual(['prone']);
      expect(result.activeStatuses).toEqual(['prone']);
    });
  });

  describe('target resolution', () => {
    it('rejects a target that leads to no actor', () => {
      const { service, world } = setup();
      const list = (target: ActorTarget) => (): unknown => service.listEffects({ target, includeDisabled: true });

      expect(list({ kind: 'actor', actorId: 'zz' })).toThrow(ActorNotFoundError);
      expect(list({ kind: 'token', tokenId: 'zz', sceneId: undefined })).toThrow(TargetTokenNotFoundError);
      expect(list({ kind: 'token', tokenId: 'empty', sceneId: undefined })).toThrow(TokenHasNoActorError);
      expect(list({ kind: 'token', tokenId: 't3', sceneId: 'missing' })).toThrow('Scene not found: missing');

      world.activeSceneId = null;
      expect(list(goblinThree)).toThrow(NoActiveSceneError);
    });

    it('resolves the target before any write', async () => {
      const { service, store } = setup();
      const missing: ActorTarget = { kind: 'actor', actorId: 'zz' };

      await expect(service.toggleStatus({ target: missing, statusId: 'prone', options: {} })).rejects.toThrow(ActorNotFoundError);
      await expect(service.addEffect({ target: missing, draft: { name: 'x' } })).rejects.toThrow(ActorNotFoundError);
      await expect(service.updateEffect({ target: missing, effectId: 'bless', changes: {} })).rejects.toThrow(ActorNotFoundError);
      await expect(service.removeEffect({ target: missing, effectId: 'bless' })).rejects.toThrow(ActorNotFoundError);

      expect([store.toggled, store.created, store.updated, store.deleted]).toEqual([[], [], [], []]);
    });
  });

  describe('toggleStatus', () => {
    it("toggles a status on one token's own actor", async () => {
      const { service, store } = setup();
      store.toggleOutcome = { active: true, effectId: 'new-effect' };

      const result = await service.toggleStatus({ target: goblinThree, statusId: 'stunned', options: { active: true } });

      expect(store.toggled).toEqual([
        { ref: { kind: 'token', sceneId: 'cave', tokenId: 't3' }, statusId: 'stunned', options: { active: true } }
      ]);
      expect(result).toEqual({ actorId: 'g1', statusId: 'stunned', toggle: { active: true, effectId: 'new-effect' } });
    });

    it('reports a status that was switched off', async () => {
      const { service, store } = setup();
      store.toggleOutcome = { active: false, effectId: null };

      const result = await service.toggleStatus({ target: hero, statusId: 'prone', options: {} });

      expect(result.toggle).toEqual({ active: false, effectId: null });
    });
  });

  describe('addEffect', () => {
    it('adds the effect to the resolved actor', async () => {
      const { service, store } = setup();
      const draft = { name: 'Haste', duration: { rounds: 10 } };

      const result = await service.addEffect({ target: hero, draft });

      expect(store.created).toEqual([{ ref: { kind: 'world', actorId: 'a1' }, draft }]);
      expect(result).toEqual({ actorId: 'a1', effect: { id: 'created', name: 'Haste' } });
    });

    it('fails when the core created nothing', async () => {
      const { service, store } = setup();
      store.createsNothing = true;

      const adding = service.addEffect({ target: hero, draft: { name: 'Haste' } });

      await expect(adding).rejects.toThrow(EffectCreationFailedError);
      await expect(adding).rejects.toThrow('Failed to create effect');
    });
  });

  describe('updateEffect', () => {
    it('applies the changes and reports the effect as it is afterwards', async () => {
      const { service, store } = setup();

      const result = await service.updateEffect({ target: hero, effectId: 'bless', changes: { name: 'Greater Bless' } });

      expect(store.updated).toEqual([
        { ref: { kind: 'world', actorId: 'a1' }, effectId: 'bless', changes: { name: 'Greater Bless' } }
      ]);
      expect(result).toEqual({ actorId: 'a1', effect: { id: 'bless', name: 'Greater Bless' } });
    });

    it('rejects an effect the actor does not have', async () => {
      const { service } = setup();

      const updating = service.updateEffect({ target: hero, effectId: 'prone', changes: {} });

      await expect(updating).rejects.toThrow(EffectNotFoundError);
      await expect(updating).rejects.toThrow('Effect not found: prone');
    });

    it('rejects when the effect disappears during the update', async () => {
      const { service, store } = setup();
      store.losesEffectOnUpdate = true;

      await expect(service.updateEffect({ target: hero, effectId: 'bless', changes: {} })).rejects.toThrow(EffectNotFoundError);
    });
  });

  describe('removeEffect', () => {
    it('removes an effect of the resolved actor', async () => {
      const { service, store } = setup();

      const result = await service.removeEffect({ target: goblinThree, effectId: 'prone' });

      expect(store.deleted).toEqual([{ ref: { kind: 'token', sceneId: 'cave', tokenId: 't3' }, effectId: 'prone' }]);
      expect(result).toEqual({ actorId: 'g1', effectId: 'prone' });
    });

    it('rejects an effect the actor does not have, and deletes nothing', async () => {
      const { service, store } = setup();

      await expect(service.removeEffect({ target: hero, effectId: 'prone' })).rejects.toThrow('Effect not found: prone');
      expect(store.deleted).toEqual([]);
    });
  });
});
