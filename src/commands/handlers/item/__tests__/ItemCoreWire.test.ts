import type { ItemGameProvider } from '../../../../core/items';
import { createAddItemToActorHandler } from '../AddItemToActorHandler';
import { createCreateItemHandler } from '../CreateItemHandler';
import { createGetActorItemsHandler } from '../GetActorItemsHandler';
import { createGetItemHandler } from '../GetItemHandler';
import { createGetItemsHandler } from '../GetItemsHandler';
import { createUpdateActorItemHandler } from '../UpdateActorItemHandler';

// Wire details of the item commands that the pre-migration tests leave open.

function provider(game: unknown): ItemGameProvider {
  return { getGame: () => game } as unknown as ItemGameProvider;
}

interface HeroMocks {
  game: unknown;
  create: jest.Mock;
  update: jest.Mock;
}

function heroGame(items: unknown[] = []): HeroMocks {
  const create = jest.fn();
  const update = jest.fn();
  const hero = {
    id: 'a1',
    name: 'Hero',
    items: { contents: items, get: (id: string) => items.find((item) => (item as { id: string }).id === id) },
    createEmbeddedDocuments: create,
    updateEmbeddedDocuments: update
  };
  return { game: { actors: { get: (id: string) => (id === 'a1' ? hero : undefined) } }, create, update };
}

const sword = { id: 'sword', name: 'Longsword', type: 'weapon', img: 'sword.webp', system: { equipped: true } };
const potion = { id: 'potion', name: 'Potion', type: 'consumable', img: null, system: {} };

describe('item commands on the wire', () => {
  describe('get-actor-items', () => {
    it('reads an empty or null type as "no type filter"', async () => {
      const handler = createGetActorItemsHandler({ gameProvider: provider(heroGame([sword, potion]).game) });

      const empty = await handler({ actorId: 'a1', type: '' });
      const nil = await handler({ actorId: 'a1', type: null } as unknown as Parameters<typeof handler>[0]);

      expect(empty.items).toHaveLength(2);
      expect(nil.items).toHaveLength(2);
    });

    it('reports the image as stored and gives a bare item the defaults', async () => {
      const handler = createGetActorItemsHandler({ gameProvider: provider(heroGame([potion]).game) });

      const result = await handler({ actorId: 'a1' });

      expect(result.items).toEqual([
        {
          id: 'potion',
          name: 'Potion',
          type: 'consumable',
          img: null,
          equipped: false,
          quantity: 1,
          hasActivities: false,
          activityTypes: [],
          description: '',
          damage: null,
          range: null
        }
      ]);
    });

    it('reports system values of another layout as stored, and never matches them with the equipped filter', async () => {
      const carried = { carryType: 'worn', handsHeld: 0 };
      const pf2eArmor = { id: 'armor', name: 'Chain Mail', type: 'armor', img: 'armor.webp', system: { equipped: carried } };
      const handler = createGetActorItemsHandler({ gameProvider: provider(heroGame([pf2eArmor]).game) });

      const all = await handler({ actorId: 'a1' });
      const equipped = await handler({ actorId: 'a1', equipped: true });

      expect(all.items[0]?.equipped).toBe(carried);
      expect(equipped.items).toEqual([]);
    });
  });

  describe('update-actor-item', () => {
    it('answers with the item as it stands when the update changes nothing', async () => {
      const { game, update } = heroGame([sword]);
      // The core drops an empty diff and hands back no document.
      update.mockResolvedValue([]);
      const handler = createUpdateActorItemHandler({ gameProvider: provider(game) });

      const result = await handler({ actorId: 'a1', itemId: 'sword', name: 'Longsword' });

      expect(update).toHaveBeenCalledWith('Item', [{ _id: 'sword', name: 'Longsword' }]);
      expect(result).toEqual({
        id: 'sword',
        name: 'Longsword',
        type: 'weapon',
        img: 'sword.webp',
        actorId: 'a1',
        actorName: 'Hero'
      });
    });

    it('fails with "Failed to update item" only when the item is gone after the update', async () => {
      const items = [sword];
      const { game, update } = heroGame(items);
      update.mockImplementation(() => {
        items.length = 0;
        return Promise.resolve([]);
      });
      const handler = createUpdateActorItemHandler({ gameProvider: provider(game) });

      await expect(handler({ actorId: 'a1', itemId: 'sword', name: 'x' })).rejects.toMatchObject({
        message: 'Failed to update item'
      });
    });

    it('sends system data beyond the fields the wire type lists', async () => {
      const { game, update } = heroGame([sword]);
      update.mockResolvedValue([sword]);
      const handler = createUpdateActorItemHandler({ gameProvider: provider(game) });

      await handler({ actorId: 'a1', itemId: 'sword', system: { uses: { spent: 1 } } } as unknown as Parameters<typeof handler>[0]);

      expect(update).toHaveBeenCalledWith('Item', [{ _id: 'sword', 'system.uses': { spent: 1 } }]);
    });
  });

  it('add-item-to-actor fails with "Failed to create item" when the core hands nothing back', async () => {
    const { game, create } = heroGame();
    create.mockResolvedValue([]);
    const handler = createAddItemToActorHandler({ gameProvider: provider(game) });

    await expect(handler({ actorId: 'a1', name: 'Dagger', type: 'weapon' })).rejects.toMatchObject({
      message: 'Failed to create item'
    });
  });

  describe('world items', () => {
    const imageless = {
      id: 'i1',
      uuid: 'Item.i1',
      name: 'Cask',
      type: 'loot',
      img: null,
      folder: null,
      toObject: () => ({ system: {} })
    };

    it('get-items does not look at its parameters at all', async () => {
      const handler = createGetItemsHandler({ gameProvider: provider({ items: { forEach: () => undefined } }) });

      await expect(handler(undefined as unknown as Record<string, never>)).resolves.toEqual([]);
    });

    it('reports a missing image as an empty string when reading, and as stored when writing', async () => {
      const create = jest.fn().mockResolvedValue(imageless);
      const game = { items: { get: () => imageless, documentClass: { create } } };

      const read = await createGetItemHandler({ gameProvider: provider(game) })({ itemId: 'i1' });
      const created = await createCreateItemHandler({ gameProvider: provider(game) })({ name: 'Cask', type: 'loot' });

      expect(read.img).toBe('');
      expect(created.img).toBeNull();
    });

    it('get-item rejects with an Error object', async () => {
      const handler = createGetItemHandler({ gameProvider: provider({ items: { get: () => undefined } }) });

      await expect(handler({ itemId: 'zz' })).rejects.toBeInstanceOf(Error);
      await expect(handler({ itemId: 'zz' })).rejects.toMatchObject({ message: 'Item not found: zz' });
    });
  });
});
