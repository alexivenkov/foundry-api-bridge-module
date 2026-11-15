import { FoundryJournalCategoryStore } from '../FoundryJournalCategoryStore';
import type { FoundryJournalCategories, FoundryJournalCategory } from '../foundryJournalCategoryTypes';
import type { FoundryJournalEntry, FoundryJournalGlobals } from '../foundryJournalTypes';

function category(id: string, name: string, sort: number): FoundryJournalCategory {
  const document: FoundryJournalCategory = { id, name, sort, update: jest.fn() };
  (document.update as jest.Mock).mockImplementation((data: Partial<FoundryJournalCategory>) => {
    Object.assign(document, data);
    return Promise.resolve(document);
  });
  return document;
}

interface World {
  store: FoundryJournalCategoryStore;
  journal: FoundryJournalEntry;
  documents: FoundryJournalCategory[];
}

function world(documents: FoundryJournalCategory[] = [], generation = 13, withCollection = true): World {
  const collection: FoundryJournalCategories = {
    get: (id) => documents.find((candidate) => candidate.id === id),
    forEach: (visit) => {
      documents.forEach(visit);
    }
  };
  const journal = {
    id: 'j1',
    categories: withCollection ? collection : undefined,
    createEmbeddedDocuments: jest.fn(),
    deleteEmbeddedDocuments: jest.fn().mockResolvedValue([])
  } as unknown as FoundryJournalEntry;
  const globals = {
    game: { journal: { get: (id: string) => (id === 'j1' ? journal : undefined), forEach: () => undefined } }
  } as unknown as FoundryJournalGlobals;
  return { store: new FoundryJournalCategoryStore(() => globals, () => generation), journal, documents };
}

describe('FoundryJournalCategoryStore', () => {
  it.each([
    [11, false],
    [12, false],
    [13, true],
    [14, true]
  ])('on Foundry %i: categories available = %s', (generation, available) => {
    expect(world([], generation).store.isAvailable()).toBe(available);
  });

  it('finds a category of a journal', () => {
    const { store } = world([category('c1', 'Lore', 100000)]);

    expect(store.findCategory('j1', 'c1')).toEqual({ id: 'c1', name: 'Lore', sort: 100000 });
    expect(store.findCategory('j1', 'zz')).toBeNull();
    expect(store.findCategory('nope', 'c1')).toBeNull();
  });

  describe('createCategory', () => {
    it('creates it with the given sort', async () => {
      const { store, journal } = world();
      (journal.createEmbeddedDocuments as jest.Mock).mockResolvedValue([category('new', 'Lore', 5)]);

      const created = await store.createCategory('j1', { name: 'Lore', sort: 5 });

      expect(journal.createEmbeddedDocuments).toHaveBeenCalledWith('JournalEntryCategory', [{ name: 'Lore', sort: 5 }]);
      expect(created).toEqual({ id: 'new', name: 'Lore', sort: 5 });
    });

    it('puts it after the last category by default, as the category editor steps', async () => {
      const { store, journal } = world([category('c1', 'A', 300000), category('c2', 'B', 100000)]);
      (journal.createEmbeddedDocuments as jest.Mock).mockResolvedValue([category('new', 'C', 400000)]);

      await store.createCategory('j1', { name: 'C' });

      expect(journal.createEmbeddedDocuments).toHaveBeenCalledWith('JournalEntryCategory', [
        { name: 'C', sort: 400000 }
      ]);
    });

    it('starts at 100000 in a journal without categories', async () => {
      const { store, journal } = world();
      (journal.createEmbeddedDocuments as jest.Mock).mockResolvedValue([category('new', 'A', 100000)]);

      await store.createCategory('j1', { name: 'A' });

      expect(journal.createEmbeddedDocuments).toHaveBeenCalledWith('JournalEntryCategory', [
        { name: 'A', sort: 100000 }
      ]);
    });

    it('resolves to null when the core created nothing, the journal is gone or has no categories', async () => {
      const { store, journal } = world();
      (journal.createEmbeddedDocuments as jest.Mock).mockResolvedValue([]);

      await expect(store.createCategory('j1', { name: 'A' })).resolves.toBeNull();
      await expect(store.createCategory('nope', { name: 'A' })).resolves.toBeNull();
      await expect(world([], 13, false).store.createCategory('j1', { name: 'A' })).resolves.toBeNull();
    });
  });

  describe('updateCategory', () => {
    it('sends only what changes and reads the category back', async () => {
      const { store, documents } = world([category('c1', 'Lore', 100000)]);

      const updated = await store.updateCategory('j1', 'c1', { name: 'Myths', sort: undefined });

      expect(documents[0]?.update).toHaveBeenCalledWith({ name: 'Myths' });
      expect(updated).toEqual({ id: 'c1', name: 'Myths', sort: 100000 });
    });

    it('resolves to null for a category that is gone', async () => {
      await expect(world().store.updateCategory('j1', 'zz', { sort: 1 })).resolves.toBeNull();
    });
  });

  it('deletes a category through its journal', async () => {
    const { store, journal } = world([category('c1', 'Lore', 1)]);

    await store.deleteCategory('j1', 'c1');

    expect(journal.deleteEmbeddedDocuments).toHaveBeenCalledWith('JournalEntryCategory', ['c1']);
  });
});
