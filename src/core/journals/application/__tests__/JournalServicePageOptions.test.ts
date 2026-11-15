import { CoreFeatureUnavailableError } from '@/core/shared';
import { JournalCategoryNotFoundError, JournalPageNotFoundError, type JournalCategoryStore } from '../../domain';
import { JournalService } from '../JournalService';
import { FakeJournalCategoryStore } from './fakeFeaturePorts';
import { FakeJournalPresenter, FakeJournalStore, FakeTextEnricher, journal, page } from './fakePorts';

function setup(categories?: JournalCategoryStore): { service: JournalService; store: FakeJournalStore } {
  const store = new FakeJournalStore([journal({ id: 'j1', pages: [page({ id: 'p1' })] })]);
  const service = new JournalService({
    journals: store,
    presenter: new FakeJournalPresenter(),
    enricher: new FakeTextEnricher(),
    categories
  });
  return { service, store };
}

const lore = new FakeJournalCategoryStore({ j1: [{ id: 'c1', name: 'Lore', sort: 100000 }] });

describe('JournalService page options', () => {
  it('hands every option of a new page to the store', async () => {
    const { service, store } = setup(lore);
    const draft = {
      name: 'Clip',
      type: 'video',
      caption: 'Intro',
      title: { show: false },
      sort: 5,
      categoryId: 'c1',
      video: { loop: true }
    };

    await service.createPage({ journalId: 'j1', draft });

    expect(store.createdPages).toEqual([{ journalId: 'j1', draft }]);
  });

  it('files a page only under a category of its journal', async () => {
    const { service, store } = setup(lore);

    await expect(
      service.createPage({ journalId: 'j1', draft: { name: 'P', type: 'text', categoryId: 'other' } })
    ).rejects.toThrow(new JournalCategoryNotFoundError('other'));
    await expect(
      service.updatePage({ journalId: 'j1', pageId: 'p1', changes: { categoryId: 'other' } })
    ).rejects.toThrow('Journal category not found: other');
    expect(store.createdPages).toEqual([]);
    expect(store.updatedPages).toEqual([]);
  });

  it('takes a page out of its category with null, without looking a category up', async () => {
    const { service, store } = setup(lore);

    await service.updatePage({ journalId: 'j1', pageId: 'p1', changes: { categoryId: null } });

    expect(store.updatedPages).toEqual([{ journalId: 'j1', pageId: 'p1', changes: { categoryId: null } }]);
  });

  it('refuses a category where the generation has none, or no category store was composed', async () => {
    const old = new FakeJournalCategoryStore();
    old.available = false;

    for (const categories of [old, undefined]) {
      const { service, store } = setup(categories);
      await expect(
        service.createPage({ journalId: 'j1', draft: { name: 'P', type: 'text', categoryId: null } })
      ).rejects.toThrow(new CoreFeatureUnavailableError('Journal categories require Foundry 13 or newer'));
      expect(store.createdPages).toEqual([]);
    }
  });

  it('writes the other options without any category store', async () => {
    const { service, store } = setup();

    await service.updatePage({ journalId: 'j1', pageId: 'p1', changes: { sort: 3, format: 'html' } });

    expect(store.updatedPages).toHaveLength(1);
  });

  it('checks the page before its category', async () => {
    const { service } = setup(lore);

    await expect(
      service.updatePage({ journalId: 'j1', pageId: 'nope', changes: { categoryId: 'other' } })
    ).rejects.toThrow(new JournalPageNotFoundError('nope'));
  });
});
