import { ActorNotFoundError, TargetTokenNotFoundError, TokenHasNoActorError, type ActorRef } from '../../../shared';
import { FoundryActorInventory } from '../FoundryActorInventory';
import type { FoundryItemOwner, FoundryItemOwnersGame, FoundryOwnedItemDocument } from '../foundryItemTypes';

function owned(overrides: Partial<FoundryOwnedItemDocument> = {}): FoundryOwnedItemDocument {
  return {
    id: 'sword',
    name: 'Longsword',
    type: 'weapon',
    img: 'sword.webp',
    system: { equipped: true, quantity: 1, activities: { contents: [{ type: 'attack' }] } },
    ...overrides
  };
}

const HERO: ActorRef = { kind: 'world', actorId: 'a1' };
const NOBODY: ActorRef = { kind: 'world', actorId: 'zz' };
const GOBLIN_THREE: ActorRef = { kind: 'token', sceneId: 'cave', tokenId: 't3' };

interface Setup {
  inventory: FoundryActorInventory;
  create: jest.Mock;
  update: jest.Mock;
  remove: jest.Mock;
  goblin: FoundryItemOwner;
}

function setup(items: FoundryOwnedItemDocument[] = [owned()]): Setup {
  const create = jest.fn();
  const update = jest.fn();
  const remove = jest.fn().mockResolvedValue([]);
  const hero: FoundryItemOwner = {
    id: 'a1',
    name: 'Hero',
    items: { contents: items, get: (id) => items.find((candidate) => candidate.id === id) },
    createEmbeddedDocuments: create,
    updateEmbeddedDocuments: update,
    deleteEmbeddedDocuments: remove
  };
  const club = owned({ id: 'club', name: 'Club', system: {} });
  const goblin: FoundryItemOwner = {
    id: 'g1',
    name: 'Goblin 3',
    items: { contents: [club], get: (id) => (id === 'club' ? club : undefined) },
    createEmbeddedDocuments: jest.fn().mockResolvedValue([{ id: 'rock', name: 'Rock', type: 'loot', img: null }]),
    updateEmbeddedDocuments: jest.fn().mockResolvedValue([]),
    deleteEmbeddedDocuments: jest.fn().mockResolvedValue([])
  };
  const tokens: Record<string, { id: string; actor: FoundryItemOwner | null }> = {
    t3: { id: 't3', actor: goblin },
    empty: { id: 'empty', actor: null }
  };
  const cave = { id: 'cave', tokens: { get: (id: string) => tokens[id] } };
  const game: FoundryItemOwnersGame = {
    actors: { get: (id) => (id === 'a1' ? hero : undefined) },
    scenes: { get: (id) => (id === 'cave' ? cave : undefined), active: null }
  };
  return { inventory: new FoundryActorInventory({ getGame: () => game }), create, update, remove, goblin };
}

describe('FoundryActorInventory', () => {
  describe('reading', () => {
    it('finds the owner of an inventory', () => {
      const { inventory } = setup();

      expect(inventory.findOwner(HERO)).toEqual({ id: 'a1', name: 'Hero' });
      expect(inventory.findOwner(NOBODY)).toBeNull();
    });

    it('lists the owned items with the traits their system data carries', () => {
      const { inventory } = setup([owned(), owned({ id: 'rope', name: 'Rope', type: 'loot', img: null, system: {} })]);

      expect(inventory.listItems(HERO)).toEqual([
        {
          id: 'sword',
          name: 'Longsword',
          type: 'weapon',
          img: 'sword.webp',
          traits: { equipped: true, quantity: 1, activityTypes: ['attack'], description: '', damage: null, range: null }
        },
        {
          id: 'rope',
          name: 'Rope',
          type: 'loot',
          img: null,
          traits: { equipped: false, quantity: 1, activityTypes: [], description: '', damage: null, range: null }
        }
      ]);
    });

    it('tells whether the actor owns an item', () => {
      const { inventory } = setup();

      expect(inventory.hasItem(HERO, 'sword')).toBe(true);
      expect(inventory.hasItem(HERO, 'zz')).toBe(false);
    });

    it('finds the owner and the items of one token\'s own actor', () => {
      const { inventory } = setup();

      expect(inventory.findOwner(GOBLIN_THREE)).toEqual({ id: 'g1', name: 'Goblin 3' });
      expect(inventory.findOwner({ kind: 'token', sceneId: 'cave', tokenId: 'empty' })).toBeNull();
      expect(inventory.findOwner({ kind: 'token', sceneId: 'gone', tokenId: 't3' })).toBeNull();
      expect(inventory.listItems(GOBLIN_THREE).map((item) => item.id)).toEqual(['club']);
      expect(inventory.hasItem(GOBLIN_THREE, 'sword')).toBe(false);
    });

    it('fails with the token lookup errors when the token or its actor is gone', () => {
      const { inventory } = setup();

      expect(() => inventory.listItems({ kind: 'token', sceneId: 'cave', tokenId: 'zz' })).toThrow(TargetTokenNotFoundError);
      expect(() => inventory.listItems({ kind: 'token', sceneId: 'cave', tokenId: 'empty' })).toThrow(TokenHasNoActorError);
    });

    it('fails with the actor lookup error when the actor is gone', () => {
      const { inventory } = setup();

      expect(() => inventory.listItems(NOBODY)).toThrow(ActorNotFoundError);
      expect(() => inventory.hasItem(NOBODY, 'sword')).toThrow('Actor not found: zz');
    });
  });

  describe('addItem', () => {
    it('creates an embedded Item from the attributes that are set', async () => {
      const { inventory, create } = setup();
      create.mockResolvedValue([{ id: 'new', name: 'Dagger', type: 'weapon', img: 'dagger.webp' }]);

      const added = await inventory.addItem(HERO, { name: 'Dagger', type: 'weapon' });

      expect(create).toHaveBeenCalledWith('Item', [{ name: 'Dagger', type: 'weapon' }]);
      expect(Object.keys((create.mock.calls[0] as [string, object[]])[1][0] ?? {})).toEqual(['name', 'type']);
      expect(added).toEqual({ id: 'new', name: 'Dagger', type: 'weapon', img: 'dagger.webp' });
    });

    it('passes the image and the system data whole', async () => {
      const { inventory, create } = setup();
      create.mockResolvedValue([{ id: 'new', name: 'Dagger', type: 'weapon', img: null }]);
      const system = { quantity: 2, rarity: 'rare' };

      await inventory.addItem(HERO, { name: 'Dagger', type: 'weapon', img: 'dagger.webp', system });

      expect(create).toHaveBeenCalledWith('Item', [{ name: 'Dagger', type: 'weapon', img: 'dagger.webp', system }]);
    });

    it('passes a sort position', async () => {
      const { inventory, create } = setup();
      create.mockResolvedValue([{ id: 'new', name: 'Dagger', type: 'weapon', img: null }]);

      await inventory.addItem(HERO, { name: 'Dagger', type: 'weapon', sort: 300 });

      expect(create).toHaveBeenCalledWith('Item', [{ name: 'Dagger', type: 'weapon', sort: 300 }]);
    });

    it('creates the item on the token\'s own actor', async () => {
      const { inventory, goblin } = setup();

      const added = await inventory.addItem(GOBLIN_THREE, { name: 'Rock', type: 'loot' });

      expect(goblin.createEmbeddedDocuments).toHaveBeenCalledWith('Item', [{ name: 'Rock', type: 'loot' }]);
      expect(added).toEqual({ id: 'rock', name: 'Rock', type: 'loot', img: null });
    });

    it('resolves to null when the core hands nothing back', async () => {
      const { inventory, create } = setup();
      create.mockResolvedValue([]);

      await expect(inventory.addItem(HERO, { name: 'Dagger', type: 'weapon' })).resolves.toBeNull();
    });
  });

  describe('updateItem', () => {
    it('names the item by _id and sends system data as one path per top-level key', async () => {
      const { inventory, update } = setup();
      update.mockResolvedValue([{ id: 'sword', name: 'Flame Tongue', type: 'weapon', img: 'sword.webp' }]);

      const updated = await inventory.updateItem(HERO, 'sword', {
        name: 'Flame Tongue',
        system: { quantity: 10, description: { value: 'Burning.' } }
      });

      expect(update).toHaveBeenCalledWith('Item', [
        { _id: 'sword', name: 'Flame Tongue', 'system.quantity': 10, 'system.description': { value: 'Burning.' } }
      ]);
      expect(updated).toEqual({ id: 'sword', name: 'Flame Tongue', type: 'weapon', img: 'sword.webp' });
    });

    it('sends a sort position as a plain field', async () => {
      const { inventory, update } = setup();
      update.mockResolvedValue([]);

      await inventory.updateItem(HERO, 'sword', { sort: 50 });

      expect(update).toHaveBeenCalledWith('Item', [{ _id: 'sword', sort: 50 }]);
    });

    it('updates and deletes items of the token\'s own actor', async () => {
      const { inventory, goblin } = setup();

      await inventory.updateItem(GOBLIN_THREE, 'club', { name: 'Big Club' });
      await inventory.removeItem(GOBLIN_THREE, 'club');

      expect(goblin.updateEmbeddedDocuments).toHaveBeenCalledWith('Item', [{ _id: 'club', name: 'Big Club' }]);
      expect(goblin.deleteEmbeddedDocuments).toHaveBeenCalledWith('Item', ['club']);
    });

    it('sends only the id when nothing is set', async () => {
      const { inventory, update } = setup();
      update.mockResolvedValue([]);

      await inventory.updateItem(HERO, 'sword', {});

      expect(update).toHaveBeenCalledWith('Item', [{ _id: 'sword' }]);
    });

    it('returns the item as it stands when the update changed nothing and the core hands back no document', async () => {
      const { inventory, update } = setup();
      update.mockResolvedValue([]);

      await expect(inventory.updateItem(HERO, 'sword', { name: 'Longsword' })).resolves.toEqual({
        id: 'sword',
        name: 'Longsword',
        type: 'weapon',
        img: 'sword.webp'
      });
    });

    it('resolves to null when the core hands back no document and the item is gone', async () => {
      const items = [owned()];
      const { inventory, update } = setup(items);
      update.mockImplementation(() => {
        items.length = 0;
        return Promise.resolve([]);
      });

      await expect(inventory.updateItem(HERO, 'sword', { name: 'x' })).resolves.toBeNull();
    });
  });

  describe('removeItem', () => {
    it('deletes the embedded Item by id', async () => {
      const { inventory, remove } = setup();

      await inventory.removeItem(HERO, 'sword');

      expect(remove).toHaveBeenCalledWith('Item', ['sword']);
    });
  });

  it('refuses to write to an actor that is gone', async () => {
    const { inventory, create } = setup();

    await expect(inventory.addItem(NOBODY, { name: 'Dagger', type: 'weapon' })).rejects.toThrow(ActorNotFoundError);
    await expect(inventory.removeItem(NOBODY, 'sword')).rejects.toThrow('Actor not found: zz');
    expect(create).not.toHaveBeenCalled();
  });
});
