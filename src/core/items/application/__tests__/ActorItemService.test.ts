import { ActorNotFoundError, NoActiveSceneError, TargetTokenNotFoundError, type ActorTarget } from '../../../shared';
import {
  ItemNotFoundError,
  OwnedItemCreationFailedError,
  OwnedItemUpdateFailedError,
  type InventoryFilter
} from '../../domain';
import { ActorItemService } from '../ActorItemService';
import { FakeActorInventory, FakeWorld, inventoryItem } from './fakePorts';

const ANY: InventoryFilter = { type: undefined, equipped: undefined, hasActivities: undefined };
const HERO = { id: 'a1', name: 'Hero' };
const GOBLIN = { id: 'g1', name: 'Goblin 3' };
const hero: ActorTarget = { kind: 'actor', actorId: 'a1' };
const mule: ActorTarget = { kind: 'actor', actorId: 'a2' };
const nobody: ActorTarget = { kind: 'actor', actorId: 'zz' };
const goblinThree: ActorTarget = { kind: 'token', tokenId: 't3', sceneId: undefined };
const GOBLIN_REF = { kind: 'token', sceneId: 'cave', tokenId: 't3' };
const HERO_REF = { kind: 'world', actorId: 'a1' };

function setup(): { service: ActorItemService; inventory: FakeActorInventory; world: FakeWorld } {
  const inventory = new FakeActorInventory(
    { 'world:a1': HERO, 'world:a2': { id: 'a2', name: 'Mule' }, 'token:cave:t3': GOBLIN },
    {
      'world:a1': [
        inventoryItem({ id: 'sword' }),
        inventoryItem({ id: 'armor', name: 'Chain Mail', type: 'equipment' }, { activityTypes: [] }),
        inventoryItem({ id: 'potion', name: 'Potion', type: 'consumable' }, { equipped: false, activityTypes: ['heal'] })
      ],
      'token:cave:t3': [inventoryItem({ id: 'club', name: 'Club' })]
    }
  );
  const world = new FakeWorld([HERO, { id: 'a2', name: 'Mule' }], { t3: GOBLIN, empty: null });
  return { service: new ActorItemService({ scenes: world, actors: world, inventory }), inventory, world };
}

describe('ActorItemService', () => {
  describe('listItems', () => {
    it('lists everything the actor owns', () => {
      const result = setup().service.listItems({ target: hero, filter: ANY });

      expect(result.owner).toEqual(HERO);
      expect(result.items.map((item) => item.id)).toEqual(['sword', 'armor', 'potion']);
    });

    it('returns an empty inventory for an actor that owns nothing', () => {
      expect(setup().service.listItems({ target: mule, filter: ANY })).toEqual({
        owner: { id: 'a2', name: 'Mule' },
        items: []
      });
    });

    it('lists the items of one token\'s own actor, on the active scene', () => {
      const result = setup().service.listItems({ target: goblinThree, filter: ANY });

      expect(result.owner).toEqual(GOBLIN);
      expect(result.items.map((item) => item.id)).toEqual(['club']);
    });

    it.each([
      ['type', { ...ANY, type: 'weapon' }, ['sword']],
      ['equipped state', { ...ANY, equipped: true }, ['sword', 'armor']],
      ['unequipped state', { ...ANY, equipped: false }, ['potion']],
      ['having activities', { ...ANY, hasActivities: true }, ['sword', 'potion']],
      ['several conditions at once', { type: 'consumable', equipped: false, hasActivities: true }, ['potion']]
    ])('filters by %s', (_case, filter, expected) => {
      const result = setup().service.listItems({ target: hero, filter });

      expect(result.items.map((item) => item.id)).toEqual(expected);
    });

    it('rejects an unknown actor', () => {
      const act = (): unknown => setup().service.listItems({ target: nobody, filter: ANY });

      expect(act).toThrow(ActorNotFoundError);
      expect(act).toThrow('Actor not found: zz');
    });

    it('rejects an unknown token, a token without an actor, and a token target without an active scene', () => {
      const { service, world } = setup();

      expect(() => service.listItems({ target: { kind: 'token', tokenId: 'zz', sceneId: undefined }, filter: ANY })).toThrow(
        TargetTokenNotFoundError
      );
      expect(() =>
        service.listItems({ target: { kind: 'token', tokenId: 'empty', sceneId: undefined }, filter: ANY })
      ).toThrow('Token has no actor: empty');
      world.activeSceneId = null;
      expect(() => service.listItems({ target: goblinThree, filter: ANY })).toThrow(NoActiveSceneError);
    });
  });

  describe('addItem', () => {
    it('adds the item to the actor and names its owner', async () => {
      const { service, inventory } = setup();
      const draft = { name: 'Dagger', type: 'weapon', system: { quantity: 2 }, sort: 100 };

      const result = await service.addItem({ target: hero, draft });

      expect(inventory.added).toEqual([{ ref: HERO_REF, draft }]);
      expect(result).toEqual({ owner: HERO, item: { id: 'added', name: 'Dagger', type: 'weapon', img: null } });
    });

    it('adds the item to one token\'s own actor', async () => {
      const { service, inventory } = setup();

      const result = await service.addItem({ target: goblinThree, draft: { name: 'Rock', type: 'loot' } });

      expect(inventory.added).toEqual([{ ref: GOBLIN_REF, draft: { name: 'Rock', type: 'loot' } }]);
      expect(result.owner).toEqual(GOBLIN);
    });

    it('reports the owner as it is once the write is done', async () => {
      const { service, inventory } = setup();
      jest.spyOn(inventory, 'findOwner').mockReturnValueOnce({ id: 'a1', name: 'Hero the Renamed' });

      const result = await service.addItem({ target: hero, draft: { name: 'Dagger', type: 'weapon' } });

      expect(result.owner.name).toBe('Hero the Renamed');
    });

    it('reports the owner as resolved when it is gone once the write is done', async () => {
      const { service, inventory } = setup();
      jest.spyOn(inventory, 'findOwner').mockReturnValueOnce(null);

      const result = await service.addItem({ target: hero, draft: { name: 'Dagger', type: 'weapon' } });

      expect(result.owner).toEqual(HERO);
    });

    it('fails when the core hands no item back', async () => {
      const { service, inventory } = setup();
      inventory.addsNothing = true;

      const adding = service.addItem({ target: hero, draft: { name: 'Dagger', type: 'weapon' } });

      await expect(adding).rejects.toThrow(OwnedItemCreationFailedError);
      await expect(adding).rejects.toThrow('Failed to create item');
    });

    it('rejects an unknown actor and adds nothing', async () => {
      const { service, inventory } = setup();

      await expect(service.addItem({ target: nobody, draft: { name: 'Dagger', type: 'weapon' } })).rejects.toThrow(
        ActorNotFoundError
      );
      expect(inventory.added).toEqual([]);
    });
  });

  describe('updateItem', () => {
    it('updates an item the actor owns', async () => {
      const { service, inventory } = setup();

      const result = await service.updateItem({
        target: hero,
        itemId: 'sword',
        changes: { name: 'Flame Tongue', system: { quantity: 2 } }
      });

      expect(inventory.updated).toEqual([
        { ref: HERO_REF, itemId: 'sword', changes: { name: 'Flame Tongue', system: { quantity: 2 } } }
      ]);
      expect(result.owner).toEqual(HERO);
      expect(result.item.name).toBe('Flame Tongue');
    });

    it('updates an item one token\'s own actor owns', async () => {
      const { service, inventory } = setup();

      await service.updateItem({ target: goblinThree, itemId: 'club', changes: { sort: 5 } });

      expect(inventory.updated).toEqual([{ ref: GOBLIN_REF, itemId: 'club', changes: { sort: 5 } }]);
    });

    it('rejects an unknown actor before looking for the item', async () => {
      await expect(setup().service.updateItem({ target: nobody, itemId: 'sword', changes: {} })).rejects.toThrow(
        'Actor not found: zz'
      );
    });

    it('rejects an item the actor does not own, and updates nothing', async () => {
      const { service, inventory } = setup();

      const updating = service.updateItem({ target: mule, itemId: 'sword', changes: { name: 'x' } });

      await expect(updating).rejects.toThrow(ItemNotFoundError);
      await expect(updating).rejects.toThrow('Item not found: sword');
      expect(inventory.updated).toEqual([]);
    });

    it('fails when the item is gone once the update is done', async () => {
      const { service, inventory } = setup();
      inventory.losesItemOnUpdate = true;

      const updating = service.updateItem({ target: hero, itemId: 'sword', changes: { name: 'Longsword' } });

      await expect(updating).rejects.toThrow(OwnedItemUpdateFailedError);
      await expect(updating).rejects.toThrow('Failed to update item');
    });

    it('answers with the item for an update that changes nothing', async () => {
      const { service } = setup();

      const result = await service.updateItem({ target: hero, itemId: 'sword', changes: { name: 'Longsword' } });

      expect(result.item).toEqual({ id: 'sword', name: 'Longsword', type: 'weapon', img: 'sword.webp' });
    });
  });

  describe('removeItem', () => {
    it('removes an item the actor owns', async () => {
      const { service, inventory } = setup();

      await service.removeItem({ target: hero, itemId: 'potion' });
      await service.removeItem({ target: goblinThree, itemId: 'club' });

      expect(inventory.removed).toEqual([
        { ref: HERO_REF, itemId: 'potion' },
        { ref: GOBLIN_REF, itemId: 'club' }
      ]);
    });

    it('rejects an unknown actor or item, and removes nothing', async () => {
      const { service, inventory } = setup();

      await expect(service.removeItem({ target: nobody, itemId: 'potion' })).rejects.toThrow(ActorNotFoundError);
      await expect(service.removeItem({ target: hero, itemId: 'zz' })).rejects.toThrow('Item not found: zz');
      expect(inventory.removed).toEqual([]);
    });
  });
});
