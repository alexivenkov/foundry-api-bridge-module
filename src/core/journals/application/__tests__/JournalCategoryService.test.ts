import { CoreFeatureUnavailableError } from '@/core/shared';
import { JournalCategoryCreationFailedError, JournalCategoryNotFoundError, JournalNotFoundError } from '../../domain';
import { JournalCategoryService } from '../JournalCategoryService';
import { FakeJournalCategoryStore } from './fakeFeaturePorts';
import { FakeJournalStore, journal } from './fakePorts';

function setup(categories = new FakeJournalCategoryStore({ j1: [{ id: 'c1', name: 'Lore', sort: 100000 }] })): {
  service: JournalCategoryService;
  categories: FakeJournalCategoryStore;
} {
  const journals = new FakeJournalStore([journal({ id: 'j1' })]);
  return { service: new JournalCategoryService({ journals, categories }), categories };
}

describe('JournalCategoryService', () => {
  describe('createCategory', () => {
    it('creates the category in the journal', async () => {
      const { service, categories } = setup();

      const created = await service.createCategory({ journalId: 'j1', draft: { name: 'Places', sort: 5 } });

      expect(created).toEqual({ id: 'new-cat', name: 'Places', sort: 5 });
      expect(categories.created).toEqual([{ journalId: 'j1', draft: { name: 'Places', sort: 5 } }]);
    });

    it('refuses below Foundry 13', async () => {
      const categories = new FakeJournalCategoryStore();
      categories.available = false;
      const { service } = setup(categories);

      const attempt = service.createCategory({ journalId: 'j1', draft: { name: 'Places' } });

      await expect(attempt).rejects.toThrow(CoreFeatureUnavailableError);
      await expect(attempt).rejects.toThrow('Journal categories require Foundry 13 or newer');
      expect(categories.created).toEqual([]);
    });

    it('refuses a journal that does not exist', async () => {
      const { service, categories } = setup();

      await expect(service.createCategory({ journalId: 'nope', draft: { name: 'X' } })).rejects.toThrow(
        new JournalNotFoundError('nope')
      );
      expect(categories.created).toEqual([]);
    });

    it('reports a creation the core vetoed', async () => {
      const categories = new FakeJournalCategoryStore();
      categories.createsNothing = true;
      const { service } = setup(categories);

      await expect(service.createCategory({ journalId: 'j1', draft: { name: 'X' } })).rejects.toThrow(
        new JournalCategoryCreationFailedError()
      );
    });
  });

  describe('updateCategory', () => {
    it('updates an existing category', async () => {
      const { service, categories } = setup();

      const updated = await service.updateCategory({ journalId: 'j1', categoryId: 'c1', changes: { name: 'Myths' } });

      expect(updated).toEqual({ id: 'c1', name: 'Myths', sort: 100000 });
      expect(categories.updated).toEqual([{ journalId: 'j1', categoryId: 'c1', changes: { name: 'Myths' } }]);
    });

    it('refuses a category the journal does not have', async () => {
      const { service, categories } = setup();

      await expect(service.updateCategory({ journalId: 'j1', categoryId: 'zz', changes: {} })).rejects.toThrow(
        'Journal category not found: zz'
      );
      expect(categories.updated).toEqual([]);
    });

    it('reports a category gone during the update as not found', async () => {
      const categories = new FakeJournalCategoryStore({ j1: [{ id: 'c1', name: 'Lore', sort: 1 }] });
      categories.losesCategoryOnUpdate = true;
      const { service } = setup(categories);

      await expect(service.updateCategory({ journalId: 'j1', categoryId: 'c1', changes: {} })).rejects.toThrow(
        new JournalCategoryNotFoundError('c1')
      );
    });
  });

  describe('deleteCategory', () => {
    it('deletes an existing category', async () => {
      const { service, categories } = setup();

      await service.deleteCategory({ journalId: 'j1', categoryId: 'c1' });

      expect(categories.deleted).toEqual([{ journalId: 'j1', categoryId: 'c1' }]);
    });

    it('refuses a missing journal, a missing category and an old Foundry', async () => {
      const { service } = setup();
      await expect(service.deleteCategory({ journalId: 'nope', categoryId: 'c1' })).rejects.toThrow(
        'Journal not found: nope'
      );
      await expect(service.deleteCategory({ journalId: 'j1', categoryId: 'zz' })).rejects.toThrow(
        'Journal category not found: zz'
      );

      const old = new FakeJournalCategoryStore();
      old.available = false;
      await expect(setup(old).service.deleteCategory({ journalId: 'j1', categoryId: 'c1' })).rejects.toThrow(
        CoreFeatureUnavailableError
      );
    });
  });
});
