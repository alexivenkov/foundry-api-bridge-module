import {
  ActorNotFoundError,
  CoreFeatureUnavailableError,
  NoActiveSceneError,
  TargetTokenNotFoundError,
  type ActorTarget
} from '../../../shared';
import {
  EffectCreationFailedError,
  EffectItemNotFoundError,
  EffectNotFoundError,
  UnknownEffectRegistryIdError
} from '../../domain';
import { EffectDetailsService } from '../EffectDetailsService';
import {
  FOUNDRY_13_FEATURES,
  FakeEffectDocumentStore,
  FakeEffectEnvironment,
  FakeWorld,
  effectDetails
} from './fakePorts';

const hero: ActorTarget = { kind: 'actor', actorId: 'a1' };
const goblinThree: ActorTarget = { kind: 'token', tokenId: 't3', sceneId: undefined };
const WORLD_ITEM = { kind: 'item', itemId: 'ring', actor: null };
const HERO_SWORD = { kind: 'item', itemId: 'sword', actor: { kind: 'world', actorId: 'a1' } };

function setup(environment = new FakeEffectEnvironment()): {
  service: EffectDetailsService;
  documents: FakeEffectDocumentStore;
  world: FakeWorld;
} {
  const documents = new FakeEffectDocumentStore(
    {
      'item:ring': { id: 'ring', name: 'Ring of Protection' },
      'item:world:a1:sword': { id: 'sword', name: 'Flame Tongue' },
      'item:token:cave:t3:club': { id: 'club', name: 'Club' }
    },
    {
      'actor:world:a1': [effectDetails({ id: 'bless', name: 'Bless', transfer: false })],
      'item:ring': [effectDetails({ id: 'aura', name: 'Protection' })],
      'item:world:a1:sword': [effectDetails({ id: 'flame', name: 'Flames' })]
    }
  );
  const world = new FakeWorld([{ id: 'a1', name: 'Hero' }], { t3: { id: 'g1', name: 'Goblin 3' } });
  return {
    service: new EffectDetailsService({ scenes: world, actors: world, documents, environment }),
    documents,
    world
  };
}

describe('EffectDetailsService', () => {
  describe('getActorEffect', () => {
    it('returns one effect of an actor in full, with the actor it was found on', () => {
      const result = setup().service.getActorEffect({ target: hero, effectId: 'bless' });

      expect(result.actor).toEqual({ id: 'a1', name: 'Hero', ref: { kind: 'world', actorId: 'a1' } });
      expect(result.effect.name).toBe('Bless');
    });

    it('rejects an unknown actor or effect', () => {
      const { service } = setup();

      expect(() => service.getActorEffect({ target: { kind: 'actor', actorId: 'zz' }, effectId: 'bless' })).toThrow(
        ActorNotFoundError
      );
      expect(() => service.getActorEffect({ target: hero, effectId: 'zz' })).toThrow(new EffectNotFoundError('zz'));
    });
  });

  describe('listItemEffects', () => {
    it('lists the effects of a world item', () => {
      const result = setup().service.listItemEffects({ item: { itemId: 'ring', owner: null } });

      expect(result.owner).toBeNull();
      expect(result.item).toEqual({ id: 'ring', name: 'Ring of Protection' });
      expect(result.effects.map((effect) => effect.id)).toEqual(['aura']);
    });

    it('lists the effects of an item a world actor or a token\'s own actor owns', () => {
      const { service } = setup();

      const sword = service.listItemEffects({ item: { itemId: 'sword', owner: hero } });
      const club = service.listItemEffects({ item: { itemId: 'club', owner: goblinThree } });

      expect(sword.owner?.ref).toEqual({ kind: 'world', actorId: 'a1' });
      expect(sword.effects.map((effect) => effect.id)).toEqual(['flame']);
      expect(club.owner).toEqual({ id: 'g1', name: 'Goblin 3', ref: { kind: 'token', sceneId: 'cave', tokenId: 't3' } });
      expect(club.effects).toEqual([]);
    });

    it('rejects an unknown item, an item the actor does not own, and an unresolvable owner', () => {
      const { service, world } = setup();

      expect(() => service.listItemEffects({ item: { itemId: 'zz', owner: null } })).toThrow(
        new EffectItemNotFoundError('zz')
      );
      expect(() => service.listItemEffects({ item: { itemId: 'ring', owner: hero } })).toThrow('Item not found: ring');
      expect(() =>
        service.listItemEffects({ item: { itemId: 'sword', owner: { kind: 'token', tokenId: 'zz', sceneId: undefined } } })
      ).toThrow(TargetTokenNotFoundError);
      world.activeSceneId = null;
      expect(() => service.listItemEffects({ item: { itemId: 'club', owner: goblinThree } })).toThrow(NoActiveSceneError);
    });
  });

  describe('createItemEffect', () => {
    it('creates the effect on the item and reports where', async () => {
      const { service, documents } = setup();
      const draft = { name: 'Fire Shield', transfer: true, duration: { value: 10, units: 'rounds' as const } };

      const result = await service.createItemEffect({ item: { itemId: 'sword', owner: hero }, draft });

      expect(documents.created).toEqual([{ host: HERO_SWORD, draft }]);
      expect(result.effect.id).toBe('created');
      expect(result.item.name).toBe('Flame Tongue');
    });

    it('fails when the core creates nothing', async () => {
      const { service, documents } = setup();
      documents.createsNothing = true;

      await expect(
        service.createItemEffect({ item: { itemId: 'ring', owner: null }, draft: { name: 'x' } })
      ).rejects.toThrow(EffectCreationFailedError);
    });

    it('refuses what the running core does not store, and creates nothing', async () => {
      const { service, documents } = setup(new FakeEffectEnvironment(FOUNDRY_13_FEATURES));

      await expect(
        service.createItemEffect({
          item: { itemId: 'ring', owner: null },
          draft: { name: 'x', duration: { value: 1, units: 'hours' } }
        })
      ).rejects.toThrow(CoreFeatureUnavailableError);
      expect(documents.created).toEqual([]);
    });

    it('refuses an unknown subtype', async () => {
      await expect(
        setup().service.createItemEffect({ item: { itemId: 'ring', owner: null }, draft: { name: 'x', type: 'curse' } })
      ).rejects.toThrow(UnknownEffectRegistryIdError);
    });
  });

  describe('updateItemEffect', () => {
    it('updates the effect and answers with it', async () => {
      const { service, documents } = setup();

      const result = await service.updateItemEffect({
        item: { itemId: 'ring', owner: null },
        effectId: 'aura',
        changes: { name: 'Greater Protection', duration: null }
      });

      expect(documents.updated).toEqual([
        { host: WORLD_ITEM, effectId: 'aura', changes: { name: 'Greater Protection', duration: null } }
      ]);
      expect(result.effect.name).toBe('Greater Protection');
    });

    it('rejects an unknown effect before checking the changes, and updates nothing', async () => {
      const { service, documents } = setup();

      await expect(
        service.updateItemEffect({ item: { itemId: 'ring', owner: null }, effectId: 'zz', changes: { name: 'x' } })
      ).rejects.toThrow('Effect not found: zz');
      expect(documents.updated).toEqual([]);
    });

    it('fails with "Effect not found" when the effect is gone once the update is done', async () => {
      const { service, documents } = setup();
      documents.losesEffectOnUpdate = true;

      await expect(
        service.updateItemEffect({ item: { itemId: 'ring', owner: null }, effectId: 'aura', changes: { name: 'x' } })
      ).rejects.toThrow(EffectNotFoundError);
    });

    it('refuses an origin the core would drop', async () => {
      const environment = new FakeEffectEnvironment();
      environment.refusedOrigins = { Bob: 'must reference a valid document type' };
      const { service, documents } = setup(environment);

      await expect(
        service.updateItemEffect({ item: { itemId: 'ring', owner: null }, effectId: 'aura', changes: { origin: 'Bob' } })
      ).rejects.toThrow('Invalid effect origin: Bob (must reference a valid document type)');
      expect(documents.updated).toEqual([]);
    });
  });

  describe('deleteItemEffect', () => {
    it('deletes the effect and reports it', async () => {
      const { service, documents } = setup();

      const result = await service.deleteItemEffect({ item: { itemId: 'sword', owner: hero }, effectId: 'flame' });

      expect(documents.deleted).toEqual([{ host: HERO_SWORD, effectId: 'flame' }]);
      expect(result).toMatchObject({ effectId: 'flame', item: { id: 'sword', name: 'Flame Tongue' } });
    });

    it('rejects an unknown item or effect, and deletes nothing', async () => {
      const { service, documents } = setup();

      await expect(service.deleteItemEffect({ item: { itemId: 'zz', owner: null }, effectId: 'aura' })).rejects.toThrow(
        'Item not found: zz'
      );
      await expect(service.deleteItemEffect({ item: { itemId: 'ring', owner: null }, effectId: 'zz' })).rejects.toThrow(
        'Effect not found: zz'
      );
      expect(documents.deleted).toEqual([]);
    });
  });
});
