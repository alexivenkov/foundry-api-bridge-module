import { FoundryWorldItemStore } from '../FoundryWorldItemStore';
import type { FoundryItemGame, FoundryWorldItemDocument } from '../foundryItemTypes';

function document(overrides: Partial<FoundryWorldItemDocument> = {}): FoundryWorldItemDocument {
  const doc: FoundryWorldItemDocument = {
    id: 'i1',
    uuid: 'Item.i1',
    name: 'Longsword',
    type: 'weapon',
    img: 'sword.webp',
    folder: { name: 'Weapons' },
    toObject: jest.fn().mockReturnValue({ system: { damage: '1d8' } }),
    update: jest.fn(),
    delete: jest.fn().mockResolvedValue(undefined),
    ...overrides
  };
  (doc.update as jest.Mock).mockImplementation((data: Partial<FoundryWorldItemDocument>) => {
    Object.assign(doc, data);
    return Promise.resolve(doc);
  });
  return doc;
}

function setup(items: FoundryWorldItemDocument[] | undefined = []): { store: FoundryWorldItemStore; create: jest.Mock } {
  const create = jest.fn();
  const game: FoundryItemGame = {
    items:
      items === undefined
        ? undefined
        : {
            get: (id) => items.find((candidate) => candidate.id === id),
            forEach: (fn) => { items.forEach(fn); },
            documentClass: { create }
          },
    actors: { get: () => undefined }
  };
  return { store: new FoundryWorldItemStore({ getGame: () => game }), create };
}

describe('FoundryWorldItemStore', () => {
  describe('reading', () => {
    it('lists every item with its folder name and stored system data', () => {
      const sword = document();
      const { store } = setup([sword, document({ id: 'i2', uuid: 'Item.i2', name: 'Potion', img: undefined, folder: null })]);

      expect(store.listItems()).toEqual([
        {
          id: 'i1',
          uuid: 'Item.i1',
          name: 'Longsword',
          type: 'weapon',
          img: 'sword.webp',
          folderName: 'Weapons',
          system: { damage: '1d8' }
        },
        { id: 'i2', uuid: 'Item.i2', name: 'Potion', type: 'weapon', img: null, folderName: null, system: { damage: '1d8' } }
      ]);
      expect(sword.toObject).toHaveBeenCalledWith(false);
    });

    it('finds one item, or null', () => {
      const { store } = setup([document()]);

      expect(store.findItem('i1')?.name).toBe('Longsword');
      expect(store.findItem('zz')).toBeNull();
    });

    it('tells whether an item exists without reading its data', () => {
      const sword = document();
      const { store } = setup([sword]);

      expect(store.hasItem('i1')).toBe(true);
      expect(store.hasItem('zz')).toBe(false);
      expect(sword.toObject).not.toHaveBeenCalled();
    });

    it('finds nothing while the world has no item collection yet', () => {
      const { store } = setup(undefined);

      expect(store.listItems()).toEqual([]);
      expect(store.findItem('i1')).toBeNull();
      expect(store.hasItem('i1')).toBe(false);
    });
  });

  describe('createItem', () => {
    it('sends only the attributes that are set, the folder by id', async () => {
      const { store, create } = setup();
      create.mockResolvedValue(document({ id: 'new', folder: null }));

      const created = await store.createItem({ name: 'Cask', type: 'loot', folderId: 'f1', system: { quantity: 2 } });

      expect(create).toHaveBeenCalledWith({ name: 'Cask', type: 'loot', folder: 'f1', system: { quantity: 2 } });
      expect(create.mock.calls[0][0]).not.toHaveProperty('img');
      expect(created).toMatchObject({ id: 'new', folderName: null });
      expect(created).not.toHaveProperty('system');
    });

    it('resolves to null when the core created nothing', async () => {
      const { store, create } = setup();
      create.mockResolvedValue(undefined);

      await expect(store.createItem({ name: 'Cask', type: 'loot' })).resolves.toBeNull();
    });
  });

  describe('updateItem', () => {
    it('updates the item and reads it back', async () => {
      const sword = document();
      const { store } = setup([sword]);
      const system = { damage: { parts: [['2d8', 'slashing']] } };

      const updated = await store.updateItem('i1', { name: 'Flame Tongue', system });

      expect(sword.update).toHaveBeenCalledWith({ name: 'Flame Tongue', system });
      expect(updated).toMatchObject({ id: 'i1', name: 'Flame Tongue' });
    });

    it('moves the item out of its folder with a null folder id', async () => {
      const sword = document();

      await setup([sword]).store.updateItem('i1', { folderId: null });

      expect(sword.update).toHaveBeenCalledWith({ folder: null });
    });

    it('sends an empty update when nothing is set', async () => {
      const sword = document();

      await setup([sword]).store.updateItem('i1', {});

      expect(sword.update).toHaveBeenCalledWith({});
    });

    it('resolves to null for an unknown item, or without a collection', async () => {
      await expect(setup().store.updateItem('zz', { name: 'x' })).resolves.toBeNull();
      await expect(setup(undefined).store.updateItem('i1', { name: 'x' })).resolves.toBeNull();
    });
  });

  describe('deleteItem', () => {
    it('deletes the item document', async () => {
      const sword = document();

      await setup([sword]).store.deleteItem('i1');

      expect(sword.delete).toHaveBeenCalledTimes(1);
    });

    it('does nothing for an item that is already gone', async () => {
      await expect(setup().store.deleteItem('zz')).resolves.toBeUndefined();
    });
  });
});
