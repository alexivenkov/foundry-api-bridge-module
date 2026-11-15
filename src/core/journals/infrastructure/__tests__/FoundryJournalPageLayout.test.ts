import { FoundryJournalStore } from '../FoundryJournalStore';
import type { FoundryJournalCategories, FoundryJournalCategory } from '../foundryJournalCategoryTypes';
import type { FoundryJournalEntry, FoundryJournalGlobals, FoundryJournalPage } from '../foundryJournalTypes';

// A page as the 13.351 / 14.368 schema stores it after creation (probe:
// `new BaseJournalEntryPage({...}).toObject()`): optional flags, caption,
// timestamp and dimensions stay undefined until set, `category` is null.
function storedPage(overrides: Partial<FoundryJournalPage> = {}): FoundryJournalPage {
  const page: FoundryJournalPage = {
    id: 'p1',
    name: 'Page',
    type: 'text',
    src: null,
    text: { format: 1 },
    title: { show: true, level: 1 },
    image: {},
    video: { controls: true, volume: 0.5 },
    sort: 0,
    category: null,
    update: jest.fn(),
    ...overrides
  };
  (page.update as jest.Mock).mockImplementation(() => Promise.resolve(page));
  return page;
}

function categories(list: Array<Pick<FoundryJournalCategory, 'id' | 'name' | 'sort'>>): FoundryJournalCategories {
  const documents = list.map((category) => ({ ...category, update: jest.fn() }));
  return {
    get: (id) => documents.find((category) => category.id === id),
    forEach: (visit) => {
      documents.forEach(visit);
    }
  };
}

function entry(pages: FoundryJournalPage[], extra: Partial<FoundryJournalEntry> = {}): FoundryJournalEntry {
  return {
    id: 'j1',
    uuid: 'JournalEntry.j1',
    name: 'Quest Log',
    folder: null,
    pages: {
      get: (id) => pages.find((page) => page.id === id),
      map: (transform) => pages.map(transform),
      forEach: (visit) => {
        pages.forEach(visit);
      }
    },
    update: jest.fn(),
    delete: jest.fn(),
    createEmbeddedDocuments: jest.fn(),
    deleteEmbeddedDocuments: jest.fn(),
    ...extra
  };
}

function storeOver(entries: FoundryJournalEntry[], generation: number): FoundryJournalStore {
  const globals = {
    game: { journal: { get: (id: string) => entries.find((candidate) => candidate.id === id), forEach: () => undefined } },
    JournalEntry: { create: jest.fn() },
    Journal: { show: jest.fn() }
  } as unknown as FoundryJournalGlobals;
  return new FoundryJournalStore(() => globals, () => generation);
}

const defaultLayout = {
  src: null,
  caption: null,
  format: 'html',
  title: { show: true, level: 1 },
  sort: 0,
  video: { controls: true, loop: false, autoplay: false, volume: 0.5, timestamp: null, width: null, height: null }
};

describe('FoundryJournalStore page layout', () => {
  describe('writing a new page', () => {
    it('sends each option where the schema keeps it and reads the created page back', async () => {
      const created = storedPage({
        id: 'p9',
        name: 'Clip',
        type: 'video',
        src: 'clips/intro.webm',
        video: { controls: false, loop: true, autoplay: true, volume: 0.25, timestamp: 12.5, width: 640, height: 360 },
        title: { show: false, level: 2 },
        image: { caption: 'Intro' },
        sort: 200000,
        category: 'c1'
      });
      const journal = entry([], { categories: categories([{ id: 'c1', name: 'Lore', sort: 100000 }]) });
      (journal.createEmbeddedDocuments as jest.Mock).mockResolvedValue([created]);

      const page = await storeOver([journal], 13).createPage('j1', {
        name: 'Clip',
        type: 'video',
        src: 'clips/intro.webm',
        caption: 'Intro',
        title: { show: false, level: 2 },
        sort: 200000,
        categoryId: 'c1',
        video: { controls: false, loop: true, autoplay: true, volume: 0.25, timestamp: 12.5, width: 640, height: 360 }
      });

      expect(journal.createEmbeddedDocuments).toHaveBeenCalledWith('JournalEntryPage', [
        {
          name: 'Clip',
          type: 'video',
          src: 'clips/intro.webm',
          image: { caption: 'Intro' },
          title: { show: false, level: 2 },
          video: { controls: false, loop: true, autoplay: true, volume: 0.25, timestamp: 12.5, width: 640, height: 360 },
          sort: 200000,
          category: 'c1'
        }
      ]);
      expect(page).toEqual({
        id: 'p9',
        name: 'Clip',
        type: 'video',
        layout: {
          src: 'clips/intro.webm',
          caption: 'Intro',
          format: 'html',
          title: { show: false, level: 2 },
          sort: 200000,
          categoryId: 'c1',
          video: { controls: false, loop: true, autoplay: true, volume: 0.25, timestamp: 12.5, width: 640, height: 360 }
        }
      });
    });

    it('sends a markdown page as format code 2 with its source, for the server to render', async () => {
      const journal = entry([]);
      (journal.createEmbeddedDocuments as jest.Mock).mockResolvedValue([
        storedPage({ text: { format: 2, markdown: '# Title', content: '<h1>Title</h1>' } })
      ]);

      const page = await storeOver([journal], 14).createPage('j1', {
        name: 'Notes',
        type: 'text',
        format: 'markdown',
        markdown: '# Title'
      });

      expect(journal.createEmbeddedDocuments).toHaveBeenCalledWith('JournalEntryPage', [
        { name: 'Notes', type: 'text', text: { format: 2, markdown: '# Title' } }
      ]);
      expect(page?.layout?.format).toBe('markdown');
    });
  });

  describe('updating a page', () => {
    it.each([
      [{ video: { timestamp: null, width: null } }, { video: { timestamp: null, width: null } }],
      [{ video: { volume: 1, autoplay: false, loop: undefined } }, { video: { volume: 1, autoplay: false } }],
      [{ caption: null }, { image: { caption: null } }],
      [{ title: { level: 4 } }, { title: { level: 4 } }],
      [{ title: {} }, {}],
      [{ text: '<p>x</p>', format: 'html' as const }, { text: { content: '<p>x</p>', format: 1 } }],
      [{ categoryId: null, sort: -3 }, { category: null, sort: -3 }]
    ])('sends %j as %j, so the update merges into what is stored', async (changes, payload) => {
      const page = storedPage();
      const journal = entry([page]);

      await storeOver([journal], 13).updatePage('j1', 'p1', changes);

      expect(page.update).toHaveBeenCalledWith(payload);
    });
  });

  describe('reading pages', () => {
    it('reads what the schema leaves unset as the core treats it', async () => {
      const page = storedPage();
      (page.update as jest.Mock).mockResolvedValue(page);

      const journal = entry([page], { categories: categories([]) });

      const updated = await storeOver([journal], 13).updatePage('j1', 'p1', { name: 'Page' });

      expect(updated?.layout).toEqual({ ...defaultLayout, categoryId: null });
    });

    it('reports a page whose category is gone as uncategorized, as the journal sheet lists it', () => {
      const journal = entry([storedPage({ category: 'deleted' }), storedPage({ id: 'p2', category: 'c1' })], {
        categories: categories([{ id: 'c1', name: 'Lore', sort: 1 }])
      });

      const content = storeOver([journal], 13).findJournalContent('j1');

      expect(content?.pages.map((page) => page.layout?.categoryId)).toEqual([null, 'c1']);
    });

    it('lists the categories of a journal in their sort order on 13+', () => {
      const journal = entry([], {
        categories: categories([
          { id: 'c2', name: 'Places', sort: 200000 },
          { id: 'c1', name: 'Lore', sort: 100000 }
        ])
      });

      expect(storeOver([journal], 14).findJournalContent('j1')?.categories).toEqual([
        { id: 'c1', name: 'Lore', sort: 100000 },
        { id: 'c2', name: 'Places', sort: 200000 }
      ]);
    });

    it('reports neither categories nor a page category below 13', () => {
      const journal = entry([storedPage()], { categories: categories([{ id: 'c1', name: 'Lore', sort: 1 }]) });

      const content = storeOver([journal], 12).findJournalContent('j1');

      expect(content?.categories).toBeUndefined();
      expect(content?.pages[0]?.layout).toEqual(defaultLayout);
      expect(content?.pages[0]?.layout).not.toHaveProperty('categoryId');
    });

    it('reads no layout from an object without the page schema', () => {
      const bare = { id: 'p1', name: 'P', type: 'text', text: {}, update: jest.fn() } as FoundryJournalPage;

      expect(storeOver([entry([bare])], 13).findJournalContent('j1')?.pages[0]?.layout).toBeUndefined();
    });
  });
});
