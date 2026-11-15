import { FoundryJournalStore } from '../FoundryJournalStore';
import { FoundryTextEnricher } from '../FoundryTextEnricher';
import type { FoundryJournalEntry, FoundryJournalGlobals, FoundryJournalPage } from '../foundryJournalTypes';

function pageDocument(overrides: Partial<FoundryJournalPage> = {}): FoundryJournalPage {
  const doc: FoundryJournalPage = {
    id: 'p1',
    name: 'Page One',
    type: 'text',
    src: null,
    text: { content: '<p>Hello</p>', markdown: '# Hello' },
    update: jest.fn(),
    ...overrides
  };
  (doc.update as jest.Mock).mockImplementation((data: Partial<FoundryJournalPage>) => {
    Object.assign(doc, data);
    return Promise.resolve(doc);
  });
  return doc;
}

interface EntryMocks {
  entry: FoundryJournalEntry;
  update: jest.Mock;
  remove: jest.Mock;
  createPages: jest.Mock;
  removePages: jest.Mock;
}

function entryDocument(
  pages: FoundryJournalPage[] = [pageDocument()],
  overrides: Partial<FoundryJournalEntry> = {}
): EntryMocks {
  const update = jest.fn();
  const remove = jest.fn().mockResolvedValue(undefined);
  const createPages = jest.fn();
  const removePages = jest.fn().mockResolvedValue([]);
  const entry: FoundryJournalEntry = {
    id: 'j1',
    uuid: 'JournalEntry.j1',
    name: 'Quest Log',
    folder: { id: 'f1', name: 'Adventures' },
    pages: {
      get: (id) => pages.find((candidate) => candidate.id === id),
      map: (transform) => pages.map(transform),
      forEach: (visit) => {
        pages.forEach(visit);
      }
    },
    update,
    delete: remove,
    createEmbeddedDocuments: createPages,
    deleteEmbeddedDocuments: removePages,
    ...overrides
  };
  update.mockImplementation((data: { name?: string; folder?: string | null }) => {
    if (data.name !== undefined) {
      entry.name = data.name;
    }
    if (data.folder !== undefined) {
      entry.folder = data.folder !== null ? { id: data.folder, name: `Folder ${data.folder}` } : null;
    }
    return Promise.resolve(entry);
  });
  return { entry, update, remove, createPages, removePages };
}

interface World {
  globals: FoundryJournalGlobals;
  create: jest.Mock;
  show: jest.Mock;
  enrichHTML: jest.Mock;
  /** Called with the name of a bare global each time one is read where it is only a deprecated alias. */
  deprecatedGlobalRead: jest.Mock;
}

/**
 * Where the core keeps the Journal and TextEditor classes:
 * - 13+: under `foundry.documents.collections` / `foundry.applications.ux` (`.implementation`), the bare
 *   globals being getters that log a compatibility warning (client/client.mjs of 13.351 and 14.368);
 * - 11-12: only as bare globals.
 */
type ClassLayout = '13+' | '11-12';

function world(entries: FoundryJournalEntry[] | undefined = [], layout: ClassLayout = '13+'): World {
  const create = jest.fn();
  const show = jest.fn().mockResolvedValue(undefined);
  const enrichHTML = jest.fn((content: string) => Promise.resolve(`<enriched>${content}</enriched>`));
  const deprecatedGlobalRead = jest.fn();
  const journalClass = { show };
  const editor = { enrichHTML };
  const documents = {
    game: {
      journal:
        entries !== undefined
          ? {
              get: (id: string) => entries.find((candidate) => candidate.id === id),
              forEach: (visit: (entry: FoundryJournalEntry) => void) => {
                entries.forEach(visit);
              }
            }
          : undefined
    },
    JournalEntry: { create }
  };
  const globals: FoundryJournalGlobals =
    layout === '13+'
      ? {
          ...documents,
          foundry: {
            documents: { collections: { Journal: journalClass } },
            applications: { ux: { TextEditor: { implementation: editor } } }
          },
          get Journal() {
            deprecatedGlobalRead('Journal');
            return journalClass;
          },
          get TextEditor() {
            deprecatedGlobalRead('TextEditor');
            return editor;
          }
        }
      : { ...documents, Journal: journalClass, TextEditor: editor };
  return { globals, create, show, enrichHTML, deprecatedGlobalRead };
}

function storeOver(target: World): FoundryJournalStore {
  return new FoundryJournalStore(() => target.globals);
}

describe('FoundryJournalStore', () => {
  describe('reading content', () => {
    it('maps a journal and everything its pages hold, the folder by name', () => {
      const { entry } = entryDocument([
        pageDocument(),
        pageDocument({ id: 'p2', name: 'Map', type: 'image', src: 'maps/town.png', text: {} })
      ]);

      expect(storeOver(world([entry])).listJournals()).toEqual([
        {
          id: 'j1',
          uuid: 'JournalEntry.j1',
          name: 'Quest Log',
          folderName: 'Adventures',
          pages: [
            { id: 'p1', name: 'Page One', type: 'text', text: '<p>Hello</p>', markdown: '# Hello', src: null },
            { id: 'p2', name: 'Map', type: 'image', text: null, markdown: null, src: 'maps/town.png' }
          ]
        }
      ]);
    });

    it('reads a journal outside any folder and a page without a source', () => {
      const { entry } = entryDocument([pageDocument({ src: undefined })], { folder: null });

      const [found] = storeOver(world([entry])).listJournals();

      expect(found?.folderName).toBeNull();
      expect(found?.pages[0]?.src).toBeNull();
    });

    it('coerces a page id and type that are not strings when reading content, and only then', () => {
      const numeric = pageDocument({ id: 7 as unknown as string, type: 42 as unknown as string });
      const store = storeOver(world([entryDocument([numeric]).entry]));

      expect(store.listJournals()[0]?.pages[0]).toMatchObject({ id: '7', type: '42' });
      expect(store.findPage('j1', 7 as unknown as string)).toEqual({ id: 7, name: 'Page One', type: 42 });
    });

    it('lists journals in the order of the collection', () => {
      const first = entryDocument([], { id: 'b' }).entry;
      const second = entryDocument([], { id: 'a' }).entry;

      expect(storeOver(world([first, second])).listJournals().map((found) => found.id)).toEqual(['b', 'a']);
    });

    it('lists nothing while the world has no journal collection', () => {
      expect(storeOver(world(undefined)).listJournals()).toEqual([]);
    });

    it('finds the content of one journal, or null', () => {
      const store = storeOver(world([entryDocument().entry]));

      expect(store.findJournalContent('j1')?.pages).toHaveLength(1);
      expect(store.findJournalContent('gone')).toBeNull();
    });
  });

  describe('finding', () => {
    it('identifies a journal without reading its pages', () => {
      const pages = { get: jest.fn(), map: jest.fn(), forEach: jest.fn() };
      const { entry } = entryDocument([], { pages });

      expect(storeOver(world([entry])).findJournal('j1')).toEqual({ id: 'j1', name: 'Quest Log' });
      expect(pages.get).not.toHaveBeenCalled();
      expect(pages.map).not.toHaveBeenCalled();
      expect(pages.forEach).not.toHaveBeenCalled();
    });

    it('finds a page of a journal', () => {
      const store = storeOver(world([entryDocument().entry]));

      expect(store.findPage('j1', 'p1')).toEqual({ id: 'p1', name: 'Page One', type: 'text' });
    });

    it('returns null for an unknown journal or page', () => {
      const store = storeOver(world([entryDocument().entry]));

      expect(store.findJournal('gone')).toBeNull();
      expect(store.findPage('j1', 'gone')).toBeNull();
      expect(store.findPage('gone', 'p1')).toBeNull();
    });
  });

  describe('createJournal', () => {
    it('creates a bare journal and reports it with its folder by id', async () => {
      const target = world();
      target.create.mockResolvedValue(entryDocument().entry);

      await expect(storeOver(target).createJournal({ name: 'Quest Log' })).resolves.toEqual({
        id: 'j1',
        name: 'Quest Log',
        folderId: 'f1',
        pages: [{ id: 'p1', name: 'Page One', type: 'text' }]
      });
      expect(target.create).toHaveBeenCalledWith({ name: 'Quest Log' });
      expect(Object.keys((target.create.mock.calls[0] as [object])[0])).toEqual(['name']);
    });

    it('writes the folder, also when it is null', async () => {
      const target = world();
      target.create.mockResolvedValue(entryDocument([], { folder: null }).entry);

      await storeOver(target).createJournal({ name: 'Loose', folderId: null });

      expect(target.create).toHaveBeenCalledWith({ name: 'Loose', folder: null });
    });

    it('creates the journal with its first page, text going to text.content', async () => {
      const target = world();
      target.create.mockResolvedValue(entryDocument().entry);

      await storeOver(target).createJournal({
        name: 'Session Notes',
        folderId: 'f1',
        firstPage: { name: 'Session Notes', type: 'text', text: '<p>Today…</p>' }
      });

      expect(target.create).toHaveBeenCalledWith({
        name: 'Session Notes',
        folder: 'f1',
        pages: [{ name: 'Session Notes', type: 'text', text: { content: '<p>Today…</p>' } }]
      });
    });

    it('creates a first page without text when the draft has none', async () => {
      const target = world();
      target.create.mockResolvedValue(entryDocument().entry);

      await storeOver(target).createJournal({ name: 'Map', firstPage: { name: 'Map', type: 'image' } });

      expect(target.create).toHaveBeenCalledWith({ name: 'Map', pages: [{ name: 'Map', type: 'image' }] });
    });

    it.each([undefined, null])('resolves to null when the core created nothing (%p)', async (nothing) => {
      const target = world();
      target.create.mockResolvedValue(nothing);

      await expect(storeOver(target).createJournal({ name: 'Vetoed' })).resolves.toBeNull();
    });
  });

  describe('updateJournal', () => {
    it('sends a partial update and returns the journal as it is afterwards', async () => {
      const { entry, update } = entryDocument();

      const updated = await storeOver(world([entry])).updateJournal('j1', { folderId: 'f2' });

      expect(update).toHaveBeenCalledWith({ folder: 'f2' });
      expect(updated).toMatchObject({ name: 'Quest Log', folderId: 'f2' });
    });

    it('sends the name and a null folder', async () => {
      const { entry, update } = entryDocument();

      const updated = await storeOver(world([entry])).updateJournal('j1', { name: 'Renamed', folderId: null });

      expect(update).toHaveBeenCalledWith({ name: 'Renamed', folder: null });
      expect(updated).toMatchObject({ name: 'Renamed', folderId: null });
    });

    it('still sends an update that changes nothing', async () => {
      const { entry, update } = entryDocument();

      await storeOver(world([entry])).updateJournal('j1', {});

      expect(update).toHaveBeenCalledWith({});
    });

    it('resolves to null for an unknown journal', async () => {
      await expect(storeOver(world()).updateJournal('gone', { name: 'x' })).resolves.toBeNull();
    });
  });

  describe('deleteJournal', () => {
    it('deletes the journal through its document', async () => {
      const { entry, remove } = entryDocument();

      await storeOver(world([entry])).deleteJournal('j1');

      expect(remove).toHaveBeenCalledTimes(1);
    });

    it('does nothing for a journal that is already gone', async () => {
      await expect(storeOver(world()).deleteJournal('gone')).resolves.toBeUndefined();
    });
  });

  describe('pages', () => {
    it('creates a page as an embedded document', async () => {
      const { entry, createPages } = entryDocument();
      createPages.mockResolvedValue([pageDocument({ id: 'new', name: 'Rules', type: 'pdf' })]);

      const created = await storeOver(world([entry])).createPage('j1', {
        name: 'Rules',
        type: 'pdf',
        src: 'docs/rules.pdf'
      });

      expect(createPages).toHaveBeenCalledWith('JournalEntryPage', [
        { name: 'Rules', type: 'pdf', src: 'docs/rules.pdf' }
      ]);
      expect(created).toEqual({ id: 'new', name: 'Rules', type: 'pdf' });
    });

    it('writes text content and a null source when the draft carries them', async () => {
      const { entry, createPages } = entryDocument();
      createPages.mockResolvedValue([pageDocument()]);

      await storeOver(world([entry])).createPage('j1', { name: 'Notes', type: 'text', text: null, src: null });

      expect(createPages).toHaveBeenCalledWith('JournalEntryPage', [
        { name: 'Notes', type: 'text', text: { content: null }, src: null }
      ]);
    });

    it('resolves to null when no page was created or the journal is gone', async () => {
      const { entry, createPages } = entryDocument();
      createPages.mockResolvedValue([]);
      const store = storeOver(world([entry]));

      await expect(store.createPage('j1', { name: 'Page', type: 'text' })).resolves.toBeNull();
      await expect(store.createPage('gone', { name: 'Page', type: 'text' })).resolves.toBeNull();
    });

    it('updates a page partially, content going to text.content whatever the page type', async () => {
      const image = pageDocument({ id: 'p2', type: 'image' });
      const store = storeOver(world([entryDocument([image]).entry]));

      const updated = await store.updatePage('j1', 'p2', { name: 'Renamed', text: '<p>Caption</p>', src: 'a.png' });

      expect(image.update).toHaveBeenCalledWith({
        name: 'Renamed',
        text: { content: '<p>Caption</p>' },
        src: 'a.png'
      });
      expect(updated).toEqual({ id: 'p2', name: 'Renamed', type: 'image' });
    });

    it('still sends a page update that changes nothing', async () => {
      const doc = pageDocument();

      await storeOver(world([entryDocument([doc]).entry])).updatePage('j1', 'p1', {});

      expect(doc.update).toHaveBeenCalledWith({});
    });

    it('resolves to null when the page to update is unknown', async () => {
      const store = storeOver(world([entryDocument().entry]));

      await expect(store.updatePage('j1', 'gone', { name: 'x' })).resolves.toBeNull();
      await expect(store.updatePage('gone', 'p1', { name: 'x' })).resolves.toBeNull();
    });

    it('deletes a page as an embedded document', async () => {
      const { entry, removePages } = entryDocument();

      await storeOver(world([entry])).deletePage('j1', 'p1');

      expect(removePages).toHaveBeenCalledWith('JournalEntryPage', ['p1']);
    });
  });

  describe('show', () => {
    it('shows the journal document with no options by default', async () => {
      const { entry } = entryDocument();
      const target = world([entry]);

      await expect(storeOver(target).show({ journalId: 'j1' }, { force: false })).resolves.toBe(true);

      expect(target.show).toHaveBeenCalledTimes(1);
      const [shown, options] = target.show.mock.calls[0] as [unknown, object];
      expect(shown).toBe(entry);
      expect(options).toEqual({});
      expect(Object.keys(options)).toEqual([]);
    });

    it('shows through foundry.documents.collections.Journal without reading the deprecated global', async () => {
      const target = world([entryDocument().entry]);

      await storeOver(target).show({ journalId: 'j1' }, { force: false });

      expect(target.show).toHaveBeenCalledTimes(1);
      expect(target.deprecatedGlobalRead).not.toHaveBeenCalled();
    });

    it('falls back to the Journal global where the namespace does not exist (Foundry 11 and 12)', async () => {
      const { entry } = entryDocument();
      const target = world([entry], '11-12');

      await expect(storeOver(target).show({ journalId: 'j1' }, { force: true })).resolves.toBe(true);

      expect(target.show).toHaveBeenCalledWith(entry, { force: true });
    });

    it('shows the page document when a page is named', async () => {
      const doc = pageDocument();
      const target = world([entryDocument([doc]).entry]);

      await storeOver(target).show({ journalId: 'j1', pageId: 'p1' }, { force: false });

      expect((target.show.mock.calls[0] as [unknown])[0]).toBe(doc);
    });

    it('forces the display and hands the user list over as given', async () => {
      const target = world([entryDocument().entry]);
      const users = ['u1', 'not-a-user'];

      await storeOver(target).show({ journalId: 'j1' }, { force: true, users });

      expect(target.show).toHaveBeenCalledWith(expect.anything(), { force: true, users });
      expect((target.show.mock.calls[0] as [unknown, { users: unknown }])[1].users).toBe(users);
    });

    it('resolves to false, showing nothing, when the journal or page is gone', async () => {
      const target = world([entryDocument().entry]);
      const store = storeOver(target);

      await expect(store.show({ journalId: 'gone' }, { force: false })).resolves.toBe(false);
      await expect(store.show({ journalId: 'j1', pageId: 'gone' }, { force: false })).resolves.toBe(false);
      expect(target.show).not.toHaveBeenCalled();
    });
  });

  it('reads the globals at call time, not when it is built', () => {
    const holder = { current: world([]) };
    const store = new FoundryJournalStore(() => holder.current.globals);

    holder.current = world([entryDocument().entry]);

    expect(store.findJournal('j1')).not.toBeNull();
  });
});

describe('FoundryTextEnricher', () => {
  it('enriches through the configured editor under foundry.applications.ux, secrets included', async () => {
    const target = world();

    await expect(new FoundryTextEnricher(() => target.globals).enrich('<p>@UUID[Actor.1]{Hero}</p>')).resolves.toBe(
      '<enriched><p>@UUID[Actor.1]{Hero}</p></enriched>'
    );
    expect(target.enrichHTML).toHaveBeenCalledWith('<p>@UUID[Actor.1]{Hero}</p>', { secrets: true });
    expect(target.deprecatedGlobalRead).not.toHaveBeenCalled();
  });

  it('calls enrichHTML on the editor class itself, as the core expects', async () => {
    const target = world();
    const implementation = target.globals.foundry?.applications?.ux?.TextEditor?.implementation;
    target.enrichHTML.mockImplementation(function (this: unknown, content: string) {
      return Promise.resolve(this === implementation ? `<own>${content}</own>` : 'detached');
    });

    await expect(new FoundryTextEnricher(() => target.globals).enrich('x')).resolves.toBe('<own>x</own>');
  });

  it('falls back to the TextEditor global where the namespace does not exist (Foundry 11 and 12)', async () => {
    const target = world([], '11-12');

    await expect(new FoundryTextEnricher(() => target.globals).enrich('<p>Hi</p>')).resolves.toBe(
      '<enriched><p>Hi</p></enriched>'
    );
    expect(target.enrichHTML).toHaveBeenCalledWith('<p>Hi</p>', { secrets: true });
  });

  it('resolves to null when the core has no text editor at all', async () => {
    const { TextEditor: _editor, ...withoutEditor } = world([], '11-12').globals;

    await expect(new FoundryTextEnricher(() => withoutEditor).enrich('<p>Hi</p>')).resolves.toBeNull();
  });

  it('lets a failing enrichment reject, for the service to handle', async () => {
    const target = world();
    target.enrichHTML.mockRejectedValue(new Error('Enrichment failed'));

    await expect(new FoundryTextEnricher(() => target.globals).enrich('<p>Hi</p>')).rejects.toThrow('Enrichment failed');
  });
});
