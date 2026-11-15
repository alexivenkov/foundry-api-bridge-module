import {
  JournalCreationCancelledError,
  JournalNotFoundError,
  JournalPageCreationFailedError,
  JournalPageNotFoundError
} from '../../domain';
import { JournalService } from '../JournalService';
import { FakeJournalPresenter, FakeJournalStore, FakeTextEnricher, journal, page } from './fakePorts';

function setup(store: FakeJournalStore = new FakeJournalStore([journal()])): {
  service: JournalService;
  store: FakeJournalStore;
  presenter: FakeJournalPresenter;
  enricher: FakeTextEnricher;
} {
  const presenter = new FakeJournalPresenter();
  const enricher = new FakeTextEnricher();
  return { service: new JournalService({ journals: store, presenter, enricher }), store, presenter, enricher };
}

describe('JournalService', () => {
  describe('reading', () => {
    const library = [
      journal({
        id: 'j1',
        pages: [
          page({ id: 'p1', text: '<p>Start</p>', markdown: '# Start' }),
          page({ id: 'p2', type: 'image', text: null, src: 'maps/town.png' })
        ]
      }),
      journal({ id: 'j2', uuid: 'JournalEntry.j2', name: 'Empty', folderName: null, pages: [] })
    ];

    it('lists every journal with its text enriched', async () => {
      const { service, enricher } = setup(new FakeJournalStore(library));

      const journals = await service.listJournals({ light: false });

      expect(journals).toEqual([
        {
          id: 'j1',
          uuid: 'JournalEntry.j1',
          name: 'Quest Log',
          folderName: 'Adventures',
          pages: [
            {
              id: 'p1',
              name: 'Page One',
              type: 'text',
              text: '<p>Start</p>',
              markdown: '# Start',
              src: null,
              enrichedText: '<enriched><p>Start</p></enriched>'
            },
            {
              id: 'p2',
              name: 'Page One',
              type: 'image',
              text: null,
              markdown: null,
              src: 'maps/town.png',
              enrichedText: null
            }
          ]
        },
        { id: 'j2', uuid: 'JournalEntry.j2', name: 'Empty', folderName: null, pages: [] }
      ]);
      expect(enricher.enriched).toEqual(['<p>Start</p>']);
    });

    it('lists an index without any text and without enriching anything', async () => {
      const { service, enricher } = setup(new FakeJournalStore(library));

      const journals = await service.listJournals({ light: true });

      expect(journals[0]?.pages).toEqual([
        { id: 'p1', name: 'Page One', type: 'text', text: null, markdown: null, src: null, enrichedText: null },
        { id: 'p2', name: 'Page One', type: 'image', text: null, markdown: null, src: 'maps/town.png', enrichedText: null }
      ]);
      expect(enricher.enriched).toEqual([]);
    });

    it('keeps the order of journals and pages', async () => {
      const store = new FakeJournalStore([
        journal({ id: 'b', pages: [page({ id: 'p2' }), page({ id: 'p1' })] }),
        journal({ id: 'a' })
      ]);

      const journals = await setup(store).service.listJournals({ light: false });

      expect(journals.map((entry) => entry.id)).toEqual(['b', 'a']);
      expect(journals[0]?.pages.map((entry) => entry.id)).toEqual(['p2', 'p1']);
    });

    it('lists nothing in a world without journals', async () => {
      await expect(setup(new FakeJournalStore()).service.listJournals({ light: false })).resolves.toEqual([]);
    });

    it('returns the raw text when enrichment fails, for that page only', async () => {
      const store = new FakeJournalStore([
        journal({ pages: [page({ id: 'p1', text: '<p>Broken</p>' }), page({ id: 'p2', text: '<p>Fine</p>' })] })
      ]);
      const { service, enricher } = setup(store);
      enricher.failsOn = ['<p>Broken</p>'];

      const [found] = await service.listJournals({ light: false });

      expect(found?.pages.map((entry) => entry.enrichedText)).toEqual([
        '<p>Broken</p>',
        '<enriched><p>Fine</p></enriched>'
      ]);
    });

    it('leaves the enriched text empty when the core offers no enrichment', async () => {
      const { service, enricher } = setup();
      enricher.available = false;

      const found = await service.getJournal({ journalId: 'j1' });

      expect(found.pages[0]).toMatchObject({ text: '<p>Hello</p>', enrichedText: null });
    });

    it('enriches an empty text too', async () => {
      const { service, enricher } = setup(new FakeJournalStore([journal({ pages: [page({ text: '' })] })]));

      await service.getJournal({ journalId: 'j1' });

      expect(enricher.enriched).toEqual(['']);
    });

    it('gets one journal in full', async () => {
      const found = await setup().service.getJournal({ journalId: 'j1' });

      expect(found.name).toBe('Quest Log');
      expect(found.pages[0]?.enrichedText).toBe('<enriched><p>Hello</p></enriched>');
    });

    it('rejects an unknown journal', async () => {
      await expect(setup().service.getJournal({ journalId: 'gone' })).rejects.toThrow(JournalNotFoundError);
      await expect(setup().service.getJournal({ journalId: '' })).rejects.toThrow('Journal not found: ');
    });
  });

  describe('createJournal', () => {
    it('creates the journal from the draft', async () => {
      const { service, store } = setup();
      const draft = { name: 'Session Notes', folderId: 'f1' };

      await expect(service.createJournal({ draft })).resolves.toEqual({
        id: 'created',
        name: 'Session Notes',
        folderId: 'f1',
        pages: []
      });
      expect(store.created).toEqual([draft]);
    });

    it('fails when the core created nothing', async () => {
      const { service, store } = setup();
      store.createsNothing = true;

      await expect(service.createJournal({ draft: { name: 'Vetoed' } })).rejects.toThrow(JournalCreationCancelledError);
      await expect(service.createJournal({ draft: { name: 'Vetoed' } })).rejects.toThrow(
        'Journal creation was cancelled by Foundry (a module hook may have vetoed it)'
      );
    });
  });

  describe('updateJournal', () => {
    it('applies the changes to an existing journal', async () => {
      const { service, store } = setup();

      const updated = await service.updateJournal({ journalId: 'j1', changes: { name: 'Renamed' } });

      expect(store.updated).toEqual([{ journalId: 'j1', changes: { name: 'Renamed' } }]);
      expect(updated.name).toBe('Renamed');
    });

    it('sends an update that changes nothing as well', async () => {
      const { service, store } = setup();

      await service.updateJournal({ journalId: 'j1', changes: {} });

      expect(store.updated).toEqual([{ journalId: 'j1', changes: {} }]);
    });

    it('rejects an unknown journal without touching the store', async () => {
      const { service, store } = setup();

      await expect(service.updateJournal({ journalId: 'gone', changes: { name: 'x' } }))
        .rejects.toThrow('Journal not found: gone');
      expect(store.updated).toEqual([]);
    });

    it('reports the journal as missing when it vanished during the update', async () => {
      const { service, store } = setup();
      store.losesDocumentOnUpdate = true;

      await expect(service.updateJournal({ journalId: 'j1', changes: {} })).rejects.toThrow(JournalNotFoundError);
    });
  });

  describe('deleteJournal', () => {
    it('deletes an existing journal', async () => {
      const { service, store } = setup();

      await service.deleteJournal({ journalId: 'j1' });

      expect(store.deleted).toEqual(['j1']);
    });

    it('rejects an unknown journal without deleting anything', async () => {
      const { service, store } = setup();

      await expect(service.deleteJournal({ journalId: 'gone' })).rejects.toThrow(JournalNotFoundError);
      expect(store.deleted).toEqual([]);
    });
  });

  describe('createPage', () => {
    const draft = { name: 'New Page', type: 'text', text: '<p>Body</p>' };

    it('adds the page to an existing journal', async () => {
      const { service, store } = setup();

      await expect(service.createPage({ journalId: 'j1', draft })).resolves.toEqual({
        id: 'created-page',
        name: 'New Page',
        type: 'text'
      });
      expect(store.createdPages).toEqual([{ journalId: 'j1', draft }]);
    });

    it('rejects an unknown journal without creating anything', async () => {
      const { service, store } = setup();

      await expect(service.createPage({ journalId: 'gone', draft })).rejects.toThrow('Journal not found: gone');
      expect(store.createdPages).toEqual([]);
    });

    it('fails when the core created nothing', async () => {
      const { service, store } = setup();
      store.createsNothing = true;

      await expect(service.createPage({ journalId: 'j1', draft })).rejects.toThrow(JournalPageCreationFailedError);
      await expect(service.createPage({ journalId: 'j1', draft })).rejects.toThrow('Failed to create journal page');
    });
  });

  describe('updatePage', () => {
    it('applies the changes to an existing page', async () => {
      const { service, store } = setup();

      const updated = await service.updatePage({ journalId: 'j1', pageId: 'p1', changes: { name: 'Renamed' } });

      expect(store.updatedPages).toEqual([{ journalId: 'j1', pageId: 'p1', changes: { name: 'Renamed' } }]);
      expect(updated).toEqual({ id: 'p1', name: 'Renamed', type: 'text' });
    });

    it('reports an unknown journal before an unknown page', async () => {
      await expect(setup().service.updatePage({ journalId: 'gone', pageId: 'gone', changes: {} }))
        .rejects.toThrow(JournalNotFoundError);
    });

    it('rejects an unknown page without touching the store', async () => {
      const { service, store } = setup();

      await expect(service.updatePage({ journalId: 'j1', pageId: 'gone', changes: { name: 'x' } }))
        .rejects.toThrow(JournalPageNotFoundError);
      await expect(service.updatePage({ journalId: 'j1', pageId: 'gone', changes: { name: 'x' } }))
        .rejects.toThrow('Page not found: gone');
      expect(store.updatedPages).toEqual([]);
    });

    it('reports the page as missing when it vanished during the update', async () => {
      const { service, store } = setup();
      store.losesDocumentOnUpdate = true;

      await expect(service.updatePage({ journalId: 'j1', pageId: 'p1', changes: {} }))
        .rejects.toThrow(JournalPageNotFoundError);
    });
  });

  describe('deletePage', () => {
    it('deletes an existing page', async () => {
      const { service, store } = setup();

      await service.deletePage({ journalId: 'j1', pageId: 'p1' });

      expect(store.deletedPages).toEqual([{ journalId: 'j1', pageId: 'p1' }]);
    });

    it('rejects an unknown journal or page without deleting anything', async () => {
      const { service, store } = setup();

      await expect(service.deletePage({ journalId: 'gone', pageId: 'p1' })).rejects.toThrow('Journal not found: gone');
      await expect(service.deletePage({ journalId: 'j1', pageId: 'gone' })).rejects.toThrow('Page not found: gone');
      expect(store.deletedPages).toEqual([]);
    });
  });

  describe('showJournal', () => {
    it('shows the whole journal and names it in the result', async () => {
      const { service, presenter } = setup();
      const audience = { force: false };

      const result = await service.showJournal({ journalId: 'j1', pageId: undefined, audience });

      expect(presenter.shown).toEqual([{ target: { journalId: 'j1', pageId: undefined }, audience }]);
      expect(result).toEqual({ journal: { id: 'j1', name: 'Quest Log' }, pageId: undefined });
    });

    it('shows a single page to the chosen audience', async () => {
      const { service, presenter } = setup();
      const audience = { force: true, users: ['u1', 'u2'] };

      const result = await service.showJournal({ journalId: 'j1', pageId: 'p1', audience });

      expect(presenter.shown).toEqual([{ target: { journalId: 'j1', pageId: 'p1' }, audience }]);
      expect(result.pageId).toBe('p1');
    });

    it('rejects an unknown journal or page without showing anything', async () => {
      const { service, presenter } = setup();
      const audience = { force: false };

      await expect(service.showJournal({ journalId: 'gone', pageId: undefined, audience }))
        .rejects.toThrow('Journal not found: gone');
      await expect(service.showJournal({ journalId: 'j1', pageId: 'gone', audience }))
        .rejects.toThrow('Page not found: gone');
      expect(presenter.shown).toEqual([]);
    });

    it('reports the journal as missing when it vanished before it could be shown', async () => {
      const { service, presenter } = setup();
      presenter.losesTarget = true;

      await expect(service.showJournal({ journalId: 'j1', pageId: undefined, audience: { force: false } }))
        .rejects.toThrow(JournalNotFoundError);
    });
  });
});
