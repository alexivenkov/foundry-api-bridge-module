import { ItemCreationCancelledError, ItemNotFoundError, type WorldItemDetails } from '../../domain';
import { WorldItemService } from '../WorldItemService';
import { FakeWorldItemStore, worldItem } from './fakePorts';

function setup(): { service: WorldItemService; store: FakeWorldItemStore } {
  const store = new FakeWorldItemStore([worldItem(), worldItem({ id: 'i2', name: 'Potion', type: 'consumable' })]);
  return { service: new WorldItemService({ items: store }), store };
}

describe('WorldItemService', () => {
  describe('reading', () => {
    it('lists the items of the world', () => {
      expect(setup().service.listItems().map((item) => item.id)).toEqual(['i1', 'i2']);
    });

    it('returns one item with its system data', () => {
      expect(setup().service.getItem({ itemId: 'i2' })).toMatchObject({ id: 'i2', name: 'Potion', system: { damage: '1d8' } });
    });

    it('rejects an unknown item', () => {
      const act = (): WorldItemDetails => setup().service.getItem({ itemId: 'zz' });

      expect(act).toThrow(ItemNotFoundError);
      expect(act).toThrow('Item not found: zz');
    });
  });

  describe('createItem', () => {
    it('creates the item from the draft', async () => {
      const { service, store } = setup();
      const draft = { name: 'Cask', type: 'loot', folderId: 'f1', system: { quantity: 2 } };

      const created = await service.createItem({ draft });

      expect(store.created).toEqual([draft]);
      expect(created).toMatchObject({ id: 'created', name: 'Cask', type: 'loot' });
    });

    it('fails when the core created nothing', async () => {
      const { service, store } = setup();
      store.createsNothing = true;

      const creation = service.createItem({ draft: { name: 'Cask', type: 'loot' } });

      await expect(creation).rejects.toThrow(ItemCreationCancelledError);
      await expect(creation).rejects.toThrow('Item creation was cancelled by Foundry (a module hook may have vetoed it)');
    });
  });

  describe('updateItem', () => {
    it('applies the changes to an existing item', async () => {
      const { service, store } = setup();

      const updated = await service.updateItem({ itemId: 'i1', changes: { name: 'Flame Tongue', folderId: null } });

      expect(store.updated).toEqual([{ itemId: 'i1', changes: { name: 'Flame Tongue', folderId: null } }]);
      expect(updated.name).toBe('Flame Tongue');
    });

    it('still asks the core for an update that changes nothing', async () => {
      const { service, store } = setup();

      await service.updateItem({ itemId: 'i1', changes: {} });

      expect(store.updated).toHaveLength(1);
    });

    it('rejects an unknown item', async () => {
      await expect(setup().service.updateItem({ itemId: 'zz', changes: { name: 'x' } })).rejects.toThrow(
        'Item not found: zz'
      );
    });
  });

  describe('deleteItem', () => {
    it('deletes an existing item', async () => {
      const { service, store } = setup();

      await service.deleteItem({ itemId: 'i2' });

      expect(store.deleted).toEqual(['i2']);
    });

    it('rejects an unknown item without touching the store', async () => {
      const { service, store } = setup();

      await expect(service.deleteItem({ itemId: 'zz' })).rejects.toThrow(ItemNotFoundError);
      expect(store.deleted).toEqual([]);
    });
  });
});
