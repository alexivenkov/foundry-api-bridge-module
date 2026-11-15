import { ActorNotFoundError, TargetTokenNotFoundError, type ActorRef } from '../../../shared';
import { EffectItemNotFoundError, type EffectHost, type ItemEffectHost } from '../../domain';
import { FoundryEffectDocumentStore } from '../FoundryEffectDocumentStore';
import type {
  FoundryEffectDocumentGame,
  FoundryEffectItem,
  FoundryEffectOwnerActor,
  FoundryEffectSource,
  FoundryStoredEffect
} from '../foundryEffectTypes';

function stored(source: Partial<FoundryEffectSource> = {}): FoundryStoredEffect & { update: jest.Mock; delete: jest.Mock } {
  const document = {
    _source: { _id: 'aura', name: 'Protection', transfer: true, ...source } as FoundryEffectSource,
    update: jest.fn(),
    delete: jest.fn().mockResolvedValue(undefined)
  };
  document.update.mockImplementation((data: Partial<FoundryEffectSource>) => {
    document._source = { ...document._source, ...data };
    return Promise.resolve(document);
  });
  return document;
}

function parent<T extends object>(base: T, effects: FoundryStoredEffect[]): T & FoundryEffectItem {
  return {
    id: '',
    name: '',
    ...base,
    effects: { contents: effects, get: (id: string) => effects.find((effect) => effect._source._id === id) },
    createEmbeddedDocuments: jest.fn().mockResolvedValue([stored({ _id: 'new', name: 'New' })])
  };
}

const HERO: ActorRef = { kind: 'world', actorId: 'a1' };
const GOBLIN_THREE: ActorRef = { kind: 'token', sceneId: 'cave', tokenId: 't3' };
const RING: ItemEffectHost = { kind: 'item', itemId: 'ring', actor: null };
const HERO_SWORD: ItemEffectHost = { kind: 'item', itemId: 'sword', actor: HERO };
const GOBLIN_CLUB: ItemEffectHost = { kind: 'item', itemId: 'club', actor: GOBLIN_THREE };

interface Setup {
  store: FoundryEffectDocumentStore;
  ring: FoundryEffectItem;
  sword: FoundryEffectItem;
  club: FoundryEffectItem;
  hero: FoundryEffectOwnerActor;
  aura: ReturnType<typeof stored>;
}

function setup(generation = 14): Setup {
  const aura = stored();
  const ring = parent({ id: 'ring', name: 'Ring of Protection' }, [aura]);
  const sword = parent({ id: 'sword', name: 'Flame Tongue' }, [stored({ _id: 'flame', name: 'Flames' })]);
  const club = parent({ id: 'club', name: 'Club' }, []);
  const hero: FoundryEffectOwnerActor = {
    ...parent({ id: 'a1', name: 'Hero' }, [stored({ _id: 'bless', name: 'Bless', transfer: false })]),
    items: { get: (id) => (id === 'sword' ? sword : undefined) }
  };
  const goblin: FoundryEffectOwnerActor = {
    ...parent({ id: 'g1', name: 'Goblin 3' }, []),
    items: { get: (id) => (id === 'club' ? club : undefined) }
  };
  const cave = { id: 'cave', tokens: { get: (id: string) => (id === 't3' ? { id: 't3', actor: goblin } : undefined) } };
  const game: FoundryEffectDocumentGame = {
    actors: { get: (id) => (id === 'a1' ? hero : undefined) },
    scenes: { get: (id) => (id === 'cave' ? cave : undefined), active: null },
    items: { get: (id) => (id === 'ring' ? ring : undefined) }
  };
  return { store: new FoundryEffectDocumentStore({ getGame: () => game }, () => generation), ring, sword, club, hero, aura };
}

describe('FoundryEffectDocumentStore', () => {
  describe('finding the item', () => {
    it('finds a world item, an item of a world actor, and an item of a token\'s own actor', () => {
      const { store } = setup();

      expect(store.findItem(RING)).toEqual({ id: 'ring', name: 'Ring of Protection' });
      expect(store.findItem(HERO_SWORD)).toEqual({ id: 'sword', name: 'Flame Tongue' });
      expect(store.findItem(GOBLIN_CLUB)).toEqual({ id: 'club', name: 'Club' });
    });

    it('finds nothing for an item that is not there, and fails with the actor lookup error for a missing owner', () => {
      const { store } = setup();

      expect(store.findItem({ kind: 'item', itemId: 'sword', actor: null })).toBeNull();
      expect(store.findItem({ kind: 'item', itemId: 'ring', actor: HERO })).toBeNull();
      expect(() => store.findItem({ kind: 'item', itemId: 'x', actor: { kind: 'world', actorId: 'zz' } })).toThrow(
        ActorNotFoundError
      );
      expect(() =>
        store.findItem({ kind: 'item', itemId: 'x', actor: { kind: 'token', sceneId: 'cave', tokenId: 'zz' } })
      ).toThrow(TargetTokenNotFoundError);
    });
  });

  describe('reading effects', () => {
    it('reads the effects of an item and of an actor from their stored data', () => {
      const { store } = setup();
      const actorHost: EffectHost = { kind: 'actor', actor: HERO };

      expect(store.listEffects(RING).map((effect) => [effect.id, effect.name, effect.transfer])).toEqual([
        ['aura', 'Protection', true]
      ]);
      expect(store.findEffect(actorHost, 'bless')?.transfer).toBe(false);
      expect(store.findEffect(HERO_SWORD, 'zz')).toBeNull();
    });

    it('fails with "Item not found" when the item is gone', () => {
      const { store } = setup();

      expect(() => store.listEffects({ kind: 'item', itemId: 'zz', actor: null })).toThrow(new EffectItemNotFoundError('zz'));
    });
  });

  describe('writing effects', () => {
    it('creates an effect in the Foundry 14 shape and answers with the created document', async () => {
      const { store, club } = setup(14);

      const created = await store.createEffect(GOBLIN_CLUB, {
        name: 'Rage',
        changes: [{ key: 'system.bonus', type: 'add', value: 2 }],
        duration: { value: 1, units: 'minutes' }
      });

      expect(club.createEmbeddedDocuments).toHaveBeenCalledWith('ActiveEffect', [
        {
          name: 'Rage',
          system: { changes: [{ key: 'system.bonus', type: 'add', value: 2 }] },
          duration: { value: 1, units: 'minutes', expiry: 'turnStart', expired: false }
        }
      ]);
      expect(created?.id).toBe('new');
    });

    it('creates an effect in the Foundry 13 shape', async () => {
      const { store, ring } = setup(13);

      await store.createEffect(RING, { name: 'Rage', duration: { value: 10, units: 'rounds' } });

      expect(ring.createEmbeddedDocuments).toHaveBeenCalledWith('ActiveEffect', [
        { name: 'Rage', duration: { seconds: null, rounds: 10, turns: null } }
      ]);
    });

    it('resolves to null when the core creates nothing', async () => {
      const { store, ring } = setup();
      (ring.createEmbeddedDocuments as jest.Mock).mockResolvedValue([]);

      await expect(store.createEffect(RING, { name: 'x' })).resolves.toBeNull();
    });

    it('updates an effect and reads it back as it stands afterwards', async () => {
      const { store, aura } = setup();

      const updated = await store.updateEffect(RING, 'aura', { name: 'Greater Protection', sort: 3 });

      expect(aura.update).toHaveBeenCalledWith({ name: 'Greater Protection', sort: 3 });
      expect(updated?.name).toBe('Greater Protection');
      expect(updated?.sort).toBe(3);
    });

    it('resolves to null when the effect to update is gone, and deletes nothing that is not there', async () => {
      const { store, aura } = setup();

      await expect(store.updateEffect(RING, 'zz', { name: 'x' })).resolves.toBeNull();
      await store.deleteEffect(RING, 'zz');
      await store.deleteEffect(RING, 'aura');

      expect(aura.delete).toHaveBeenCalledTimes(1);
    });

    it('refuses to write to an item that is gone', async () => {
      const { store } = setup();

      await expect(store.createEffect({ kind: 'item', itemId: 'zz', actor: HERO }, { name: 'x' })).rejects.toThrow(
        'Item not found: zz'
      );
    });
  });
});
