import type { ItemGameProvider } from '../../../../core/items';
import { createAddItemToActorHandler } from '../AddItemToActorHandler';
import { createCreateItemHandler } from '../CreateItemHandler';
import { createDeleteActorItemHandler } from '../DeleteActorItemHandler';
import { createGetActorItemsHandler } from '../GetActorItemsHandler';
import { createUpdateActorItemHandler } from '../UpdateActorItemHandler';
import { createUpdateItemHandler } from '../UpdateItemHandler';

// Token addressing of the actor-item commands, and the sort position of items.

function provider(game: unknown): ItemGameProvider {
  return { getGame: () => game } as unknown as ItemGameProvider;
}

interface Owner {
  id: string;
  name: string;
  items: { contents: unknown[]; get(id: string): unknown };
  createEmbeddedDocuments: jest.Mock;
  updateEmbeddedDocuments: jest.Mock;
  deleteEmbeddedDocuments: jest.Mock;
}

function owner(id: string, name: string, items: { id: string; name: string; type: string; img: string | null; system: object }[]): Owner {
  return {
    id,
    name,
    items: { contents: items, get: (itemId: string) => items.find((item) => item.id === itemId) },
    createEmbeddedDocuments: jest.fn().mockResolvedValue([{ id: 'new', name: 'Rock', type: 'loot', img: null }]),
    updateEmbeddedDocuments: jest.fn().mockResolvedValue([]),
    deleteEmbeddedDocuments: jest.fn().mockResolvedValue([])
  };
}

interface World {
  game: unknown;
  hero: Owner;
  goblin: Owner;
}

function world(activeScene = true): World {
  const hero = owner('a1', 'Hero', [{ id: 'sword', name: 'Longsword', type: 'weapon', img: 'sword.webp', system: {} }]);
  // An unlinked token's actor carries the id of the world actor it was placed from.
  const goblin = owner('a1', 'Goblin 3', [{ id: 'club', name: 'Club', type: 'weapon', img: null, system: { equipped: true } }]);
  const tokens: Record<string, unknown> = { t3: { id: 't3', actor: goblin }, empty: { id: 'empty', actor: null } };
  const cave = { id: 'cave', name: 'Cave', tokens: { get: (id: string) => tokens[id] } };
  const game = {
    actors: { get: (id: string) => (id === 'a1' ? hero : undefined) },
    scenes: { get: (id: string) => (id === 'cave' ? cave : undefined), active: activeScene ? cave : null },
    items: undefined
  };
  return { game, hero, goblin };
}

describe('actor-item commands addressed to a token', () => {
  it('get-actor-items lists the items of the token\'s own actor, not of the world actor', async () => {
    const { game } = world();

    const result = await createGetActorItemsHandler({ gameProvider: provider(game) })({ tokenId: 't3' });

    expect(result.actorId).toBe('a1');
    expect(result.actorName).toBe('Goblin 3');
    expect(result.items.map((item) => item.id)).toEqual(['club']);
  });

  it('add-item-to-actor, update-actor-item and delete-actor-item write to the token\'s own actor', async () => {
    const { game, hero, goblin } = world();
    const gameProvider = provider(game);

    const added = await createAddItemToActorHandler({ gameProvider })({ tokenId: 't3', sceneId: 'cave', name: 'Rock', type: 'loot' });
    await createUpdateActorItemHandler({ gameProvider })({ tokenId: 't3', itemId: 'club', name: 'Big Club' });
    const deleted = await createDeleteActorItemHandler({ gameProvider })({ tokenId: 't3', itemId: 'club' });

    expect(goblin.createEmbeddedDocuments).toHaveBeenCalledWith('Item', [{ name: 'Rock', type: 'loot' }]);
    expect(goblin.updateEmbeddedDocuments).toHaveBeenCalledWith('Item', [{ _id: 'club', name: 'Big Club' }]);
    expect(goblin.deleteEmbeddedDocuments).toHaveBeenCalledWith('Item', ['club']);
    expect(hero.createEmbeddedDocuments).not.toHaveBeenCalled();
    expect(added).toEqual({ id: 'new', name: 'Rock', type: 'loot', img: null, actorId: 'a1', actorName: 'Goblin 3' });
    expect(deleted).toEqual({ deleted: true });
  });

  it('answers with the canonical lookup errors', async () => {
    const gameProvider = provider(world().game);
    const list = createGetActorItemsHandler({ gameProvider });

    await expect(list({ tokenId: 'zz' })).rejects.toThrow('Token not found: zz');
    await expect(list({ tokenId: 'empty' })).rejects.toThrow('Token has no actor: empty');
    await expect(list({ tokenId: 't3', sceneId: 'gone' })).rejects.toThrow('Scene not found: gone');
    await expect(createGetActorItemsHandler({ gameProvider: provider(world(false).game) })({ tokenId: 't3' })).rejects.toThrow(
      'No active scene; specify sceneId'
    );
    await expect(createDeleteActorItemHandler({ gameProvider })({ tokenId: 't3', itemId: 'sword' })).rejects.toThrow(
      'Item not found: sword'
    );
  });

  it('still requires an actor id when no token is named', async () => {
    const handler = createGetActorItemsHandler({ gameProvider: provider(world().game) });

    await expect(handler({ tokenId: '' })).rejects.toThrow(/actorId/);
    await expect(handler({ tokenId: 7 } as unknown as Parameters<typeof handler>[0])).rejects.toThrow(/tokenId/);
  });
});

describe('item sort position', () => {
  it('add-item-to-actor and update-actor-item send it as a plain field', async () => {
    const { game, hero } = world();
    const gameProvider = provider(game);

    await createAddItemToActorHandler({ gameProvider })({ actorId: 'a1', name: 'Rock', type: 'loot', sort: 100 });
    await createUpdateActorItemHandler({ gameProvider })({ actorId: 'a1', itemId: 'sword', sort: 200 });

    expect(hero.createEmbeddedDocuments).toHaveBeenCalledWith('Item', [{ name: 'Rock', type: 'loot', sort: 100 }]);
    expect(hero.updateEmbeddedDocuments).toHaveBeenCalledWith('Item', [{ _id: 'sword', sort: 200 }]);
  });

  it('create-item and update-item send it to the world item', async () => {
    const cask = { id: 'i1', uuid: 'Item.i1', name: 'Cask', type: 'loot', img: null, folder: null, update: jest.fn(), toObject: () => ({ system: {} }) };
    const create = jest.fn().mockResolvedValue(cask);
    const gameProvider = provider({ items: { get: () => cask, documentClass: { create } } });

    await createCreateItemHandler({ gameProvider })({ name: 'Cask', type: 'loot', sort: -50 });
    await createUpdateItemHandler({ gameProvider })({ itemId: 'i1', sort: 75 });

    expect(create).toHaveBeenCalledWith({ name: 'Cask', type: 'loot', sort: -50 });
    expect(cask.update).toHaveBeenCalledWith({ sort: 75 });
  });

  it('rejects a fractional sort', async () => {
    const handler = createAddItemToActorHandler({ gameProvider: provider(world().game) });

    await expect(handler({ actorId: 'a1', name: 'Rock', type: 'loot', sort: 1.5 })).rejects.toThrow(/sort/);
  });
});
