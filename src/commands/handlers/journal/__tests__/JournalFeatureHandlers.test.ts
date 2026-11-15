import { createCreateJournalPageHandler } from '../CreateJournalPageHandler';
import { createUpdateJournalPageHandler } from '../UpdateJournalPageHandler';
import { createGetJournalHandler } from '../GetJournalHandler';
import { createCreateJournalCategoryHandler } from '../CreateJournalCategoryHandler';
import { createUpdateJournalCategoryHandler } from '../UpdateJournalCategoryHandler';
import { createDeleteJournalCategoryHandler } from '../DeleteJournalCategoryHandler';
import { createShowImageHandler } from '../ShowImageHandler';
import { createPanToNoteHandler } from '../PanToNoteHandler';
import { createSearchJournalsHandler } from '../SearchJournalsHandler';
import type { JournalHandlerDependencies } from '../journalWireMappers';
import type { FoundryJournalGlobals } from '@/core/journals/infrastructure';

interface FakeCategory {
  id: string;
  name: string;
  sort: number;
  update: jest.Mock;
}

interface FakePage {
  id: string;
  name: string;
  type: string;
  src: string | null;
  text: { content?: string; markdown?: string; format: number };
  title: { show: boolean; level: number };
  image: { caption?: string };
  video: Record<string, unknown>;
  sort: number;
  category: string | null;
  update: jest.Mock;
}

// Pages and categories as the 13.351 / 14.368 schemas store them.
function fakePage(overrides: Partial<FakePage> = {}): FakePage {
  const page: FakePage = {
    id: 'p1',
    name: 'Entrance',
    type: 'text',
    src: null,
    text: { content: '<p>A goblin guard.</p>', format: 1 },
    title: { show: true, level: 1 },
    image: {},
    video: { controls: true, volume: 0.5 },
    sort: 100000,
    category: 'c1',
    update: jest.fn(),
    ...overrides
  };
  page.update.mockImplementation((data: Partial<FakePage>) => {
    Object.assign(page, data);
    return Promise.resolve(page);
  });
  return page;
}

function fakeCategory(id: string, name: string, sort: number): FakeCategory {
  const category: FakeCategory = { id, name, sort, update: jest.fn() };
  category.update.mockImplementation((data: Partial<FakeCategory>) => {
    Object.assign(category, data);
    return Promise.resolve(category);
  });
  return category;
}

function collection<T extends { id: string }>(items: T[]): {
  get(id: string): T | undefined;
  map<U>(transform: (item: T) => U): U[];
  forEach(visit: (item: T) => void): void;
} {
  return {
    get: (id) => items.find((item) => item.id === id),
    map: (transform) => items.map(transform),
    forEach: (visit) => {
      items.forEach(visit);
    }
  };
}

interface World {
  deps: JournalHandlerDependencies;
  pages: FakePage[];
  categories: FakeCategory[];
  createEmbeddedDocuments: jest.Mock;
  deleteEmbeddedDocuments: jest.Mock;
  showImage: jest.Mock;
  panToNote: jest.Mock;
}

function world(generation = 13, canvasReady = true): World {
  const pages = [fakePage(), fakePage({ id: 'p2', name: 'Goblin King', type: 'image', src: 'art/king.webp', text: { format: 1 }, category: null })];
  const categories = [fakeCategory('c1', 'Lore', 100000)];
  const createEmbeddedDocuments = jest.fn();
  const deleteEmbeddedDocuments = jest.fn().mockResolvedValue([]);
  const showImage = jest.fn();
  const panToNote = jest.fn().mockResolvedValue(undefined);
  const entry = {
    id: 'j1',
    uuid: 'JournalEntry.j1',
    name: 'Goblin Cave',
    folder: null,
    pages: collection(pages),
    categories: collection(categories),
    update: jest.fn(),
    delete: jest.fn(),
    createEmbeddedDocuments,
    deleteEmbeddedDocuments,
    panToNote
  };
  const journalClass = { show: jest.fn(), showImage };
  const globals = {
    game: {
      journal: collection([entry]),
      users: new Map([
        ['u1', { id: 'u1' }],
        ['u2', { id: 'u2' }]
      ])
    },
    JournalEntry: { create: jest.fn() },
    foundry: { documents: { collections: { Journal: journalClass } } },
    Journal: journalClass,
    canvas: {
      ready: canvasReady,
      scene: { id: 'scene-1' },
      notes: { placeables: [{ document: { id: 'n1', entryId: 'j1', x: 1200, y: 800 } }] }
    }
  } as unknown as FoundryJournalGlobals;
  return {
    deps: { globals: () => globals, generation: () => generation },
    pages,
    categories,
    createEmbeddedDocuments,
    deleteEmbeddedDocuments,
    showImage,
    panToNote
  };
}

describe('journal page options through the page handlers', () => {
  it('create-journal-page sends the options and answers the page with its layout', async () => {
    const target = world();
    target.createEmbeddedDocuments.mockImplementation((_type: string, [data]: Array<Record<string, unknown>>) =>
      Promise.resolve([fakePage({ id: 'p9', name: 'Clip', type: 'video', src: 'clips/a.webm', category: 'c1', ...data } as Partial<FakePage>)])
    );

    const result = await createCreateJournalPageHandler(target.deps)({
      journalId: 'j1',
      name: 'Clip',
      type: 'video',
      src: 'clips/a.webm',
      categoryId: 'c1',
      video: { loop: true, volume: 0.25 }
    });

    expect(target.createEmbeddedDocuments).toHaveBeenCalledWith('JournalEntryPage', [
      { name: 'Clip', type: 'video', src: 'clips/a.webm', category: 'c1', video: { loop: true, volume: 0.25 } }
    ]);
    expect(result).toEqual({
      id: 'p9',
      name: 'Clip',
      type: 'video',
      src: 'clips/a.webm',
      caption: null,
      format: 'html',
      title: { show: true, level: 1 },
      sort: 100000,
      categoryId: 'c1',
      video: { controls: true, loop: true, autoplay: false, volume: 0.25, timestamp: null, width: null, height: null }
    });
  });

  it('create-journal-page rejects an option out of range', async () => {
    await expect(
      createCreateJournalPageHandler(world().deps)({ journalId: 'j1', name: 'P', title: { level: 9 } })
    ).rejects.toThrow(/^title\.level: /);
  });

  it('update-journal-page refuses a category of no journal, and any category below Foundry 13', async () => {
    await expect(
      createUpdateJournalPageHandler(world().deps)({ journalId: 'j1', pageId: 'p1', categoryId: 'zz' })
    ).rejects.toThrow('Journal category not found: zz');
    await expect(
      createUpdateJournalPageHandler(world(12).deps)({ journalId: 'j1', pageId: 'p1', categoryId: null })
    ).rejects.toThrow('Journal categories require Foundry 13 or newer');
  });

  it('update-journal-page switches a page to markdown', async () => {
    const target = world();

    const result = await createUpdateJournalPageHandler(target.deps)({ journalId: 'j1', pageId: 'p1', markdown: '# Cave' });

    expect(target.pages[0]?.update).toHaveBeenCalledWith({ text: { format: 2, markdown: '# Cave' } });
    expect(result.id).toBe('p1');
  });
});

describe('get-journal', () => {
  it('adds each page layout and the categories on Foundry 13+', async () => {
    const result = await createGetJournalHandler(world().deps)({ journalId: 'j1' });

    expect(result.categories).toEqual([{ id: 'c1', name: 'Lore', sort: 100000 }]);
    expect(result.pages[0]).toMatchObject({ id: 'p1', text: '<p>A goblin guard.</p>', categoryId: 'c1', format: 'html' });
    expect(result.pages[1]).toMatchObject({ id: 'p2', src: 'art/king.webp', caption: null, categoryId: null });
  });

  it('has no categories below Foundry 13', async () => {
    const result = await createGetJournalHandler(world(12).deps)({ journalId: 'j1' });

    expect(result).not.toHaveProperty('categories');
    expect(result.pages[0]).not.toHaveProperty('categoryId');
    expect(result.pages[0]?.sort).toBe(100000);
  });
});

describe('journal category handlers', () => {
  it('create-journal-category creates it after the last one', async () => {
    const target = world();
    target.createEmbeddedDocuments.mockResolvedValue([fakeCategory('c2', 'Places', 200000)]);

    const result = await createCreateJournalCategoryHandler(target.deps)({ journalId: 'j1', name: 'Places' });

    expect(target.createEmbeddedDocuments).toHaveBeenCalledWith('JournalEntryCategory', [{ name: 'Places', sort: 200000 }]);
    expect(result).toEqual({ journalId: 'j1', id: 'c2', name: 'Places', sort: 200000 });
  });

  it('create-journal-category validates, refuses a missing journal and Foundry 12', async () => {
    await expect(createCreateJournalCategoryHandler(world().deps)({ journalId: 'j1', name: '' })).rejects.toThrow(/^name: /);
    await expect(createCreateJournalCategoryHandler(world().deps)({ journalId: 'nope', name: 'X' })).rejects.toThrow(
      'Journal not found: nope'
    );
    await expect(createCreateJournalCategoryHandler(world(12).deps)({ journalId: 'j1', name: 'X' })).rejects.toThrow(
      'Journal categories require Foundry 13 or newer'
    );
  });

  it('update-journal-category renames it', async () => {
    const target = world();

    const result = await createUpdateJournalCategoryHandler(target.deps)({ journalId: 'j1', categoryId: 'c1', name: 'Myths' });

    expect(target.categories[0]?.update).toHaveBeenCalledWith({ name: 'Myths' });
    expect(result).toEqual({ journalId: 'j1', id: 'c1', name: 'Myths', sort: 100000 });
  });

  it('delete-journal-category deletes it, and refuses one that does not exist', async () => {
    const target = world();

    const result = await createDeleteJournalCategoryHandler(target.deps)({ journalId: 'j1', categoryId: 'c1' });

    expect(target.deleteEmbeddedDocuments).toHaveBeenCalledWith('JournalEntryCategory', ['c1']);
    expect(result).toEqual({ deleted: true, categoryId: 'c1', journalId: 'j1' });
    await expect(createDeleteJournalCategoryHandler(target.deps)({ journalId: 'j1', categoryId: 'zz' })).rejects.toThrow(
      'Journal category not found: zz'
    );
  });
});

describe('show-image', () => {
  it('shares the image with the listed users', async () => {
    const target = world();

    const result = await createShowImageHandler(target.deps)({ src: 'art/king.webp', title: 'The King', users: ['u1'] });

    expect(target.showImage).toHaveBeenCalledWith('art/king.webp', { users: ['u1'], title: 'The King' });
    expect(result).toEqual({ shown: true, src: 'art/king.webp', title: 'The King', caption: null, users: ['u1'] });
  });

  it('refuses an unknown user and a missing source', async () => {
    const target = world();

    await expect(createShowImageHandler(target.deps)({ src: 'a.png', users: ['ghost'] })).rejects.toThrow(
      'User not found: ghost'
    );
    await expect(createShowImageHandler(target.deps)({ src: '' })).rejects.toThrow(/^src: /);
    expect(target.showImage).not.toHaveBeenCalled();
  });
});

describe('pan-to-note', () => {
  it('pans the GM canvas to the journal note', async () => {
    const target = world();

    const result = await createPanToNoteHandler(target.deps)({ journalId: 'j1', scale: 2 });

    expect(target.panToNote).toHaveBeenCalledWith({ scale: 2 });
    expect(result).toEqual({ panned: true, journalId: 'j1', sceneId: 'scene-1', noteId: 'n1', x: 1200, y: 800 });
  });

  it('refuses a missing journal and a canvas that is not ready', async () => {
    await expect(createPanToNoteHandler(world().deps)({ journalId: 'nope' })).rejects.toThrow('Journal not found: nope');
    await expect(createPanToNoteHandler(world(13, false).deps)({ journalId: 'j1' })).rejects.toThrow(
      'Canvas not ready: no scene is viewed'
    );
  });
});

describe('search-journals', () => {
  it('finds journal names, page names and page text', async () => {
    const result = await createSearchJournalsHandler(world().deps)({ query: 'goblin' });

    expect(result).toEqual({
      matches: [
        {
          journalId: 'j1',
          journalName: 'Goblin Cave',
          pageId: null,
          pageName: null,
          pageType: null,
          uuid: 'JournalEntry.j1',
          matchedIn: 'journal',
          snippet: null
        },
        {
          journalId: 'j1',
          journalName: 'Goblin Cave',
          pageId: 'p1',
          pageName: 'Entrance',
          pageType: 'text',
          uuid: 'JournalEntry.j1.JournalEntryPage.p1',
          matchedIn: 'content',
          snippet: 'A goblin guard.'
        },
        {
          journalId: 'j1',
          journalName: 'Goblin Cave',
          pageId: 'p2',
          pageName: 'Goblin King',
          pageType: 'image',
          uuid: 'JournalEntry.j1.JournalEntryPage.p2',
          matchedIn: 'name',
          snippet: null
        }
      ],
      hasMore: false
    });
  });

  it('rejects a blank query', async () => {
    await expect(createSearchJournalsHandler(world().deps)({ query: ' ' })).rejects.toThrow(/^query: /);
  });
});
