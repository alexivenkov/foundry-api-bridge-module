import { PackNotFoundError, PackTypeMismatchError } from '../../domain';
import type {
  EmbeddedPageView,
  PackContentsFilter,
  PackDocumentReader,
  PackDocumentRecord,
  PackDocumentView
} from '../../domain';
import { CompendiumQueryService } from '../CompendiumQueryService';
import {
  FakeCatalog,
  FakeIndexReader,
  FakeScanner,
  FakeSearchEngine,
  descriptor,
  summary
} from './fakePorts';

function makePage(
  id: string,
  name: string,
  text: string | null,
  type = 'text'
): EmbeddedPageView {
  return { id, name, type, text, markdown: null, enrichedText: null, src: null };
}

function makeJournal(
  id: string,
  name: string,
  pages: readonly EmbeddedPageView[] | undefined
): PackDocumentView {
  const journal: {
    id: string;
    uuid: string;
    name: string;
    type: string;
    img: string;
    pages?: readonly EmbeddedPageView[];
  } = {
    id,
    uuid: `Compendium.dnd5e.rules.JournalEntry.${id}`,
    name,
    type: '',
    img: ''
  };
  if (pages !== undefined) {
    journal.pages = pages;
  }
  return journal;
}

class JournalFakeReader implements PackDocumentReader {
  readonly readPacks: string[] = [];

  constructor(private readonly byPack: ReadonlyMap<string, readonly PackDocumentView[]>) {}

  readAllDocumentViews(
    packId: string,
    _filter?: PackContentsFilter
  ): Promise<readonly PackDocumentView[]> {
    this.readPacks.push(packId);
    return Promise.resolve(this.byPack.get(packId) ?? []);
  }

  readDocumentRecord(): Promise<PackDocumentRecord> {
    return Promise.reject(new Error('not used'));
  }

  readDocumentSource(): Promise<Record<string, unknown>> {
    return Promise.reject(new Error('not used'));
  }
}

const rulesPack = descriptor({ id: 'dnd5e.rules', label: 'Rules', type: 'JournalEntry' });
const contentPack = descriptor({
  id: 'dnd5e.content24',
  label: 'Content 24',
  type: 'JournalEntry'
});
const itemsPack = descriptor({ id: 'dnd5e.items', label: 'Items', type: 'Item' });

function makeService(
  byPack: ReadonlyMap<string, readonly PackDocumentView[]>,
  packs = [rulesPack, contentPack, itemsPack]
): { service: CompendiumQueryService; reader: JournalFakeReader } {
  const reader = new JournalFakeReader(byPack);
  const service = new CompendiumQueryService({
    catalog: new FakeCatalog(
      packs,
      packs.map(p => summary({ ...p, packageName: 'dnd5e', documentCount: 1 }))
    ),
    indexReader: new FakeIndexReader(),
    indexScanner: new FakeScanner([]),
    searchEngine: new FakeSearchEngine(),
    documentReader: reader
  });
  return { service, reader };
}

describe('CompendiumQueryService.searchJournalPages', () => {
  const grapplingJournal = makeJournal('j1', 'Combat Rules', [
    makePage('p1', 'Grappling', '<p>How to grapple.</p>', 'rule'),
    makePage('p2', 'Conditions', '<p>The grappled condition restrains you.</p>', 'rule'),
    makePage('p3', 'Falling', '<p>You take damage.</p>', 'rule')
  ]);

  it('matches page names and page content across journal packs with addresses', async () => {
    const { service } = makeService(new Map([['dnd5e.rules', [grapplingJournal]]]));

    const matches = await service.searchJournalPages({ query: 'grappl' });

    expect(matches).toEqual([
      {
        packId: 'dnd5e.rules',
        packLabel: 'Rules',
        journalId: 'j1',
        journalName: 'Combat Rules',
        pageId: 'p1',
        pageName: 'Grappling',
        pageType: 'rule',
        uuid: 'Compendium.dnd5e.rules.JournalEntry.j1.JournalEntryPage.p1',
        matchedIn: 'name',
        snippet: null
      },
      {
        packId: 'dnd5e.rules',
        packLabel: 'Rules',
        journalId: 'j1',
        journalName: 'Combat Rules',
        pageId: 'p2',
        pageName: 'Conditions',
        pageType: 'rule',
        uuid: 'Compendium.dnd5e.rules.JournalEntry.j1.JournalEntryPage.p2',
        matchedIn: 'content',
        snippet: 'The grappled condition restrains you.'
      }
    ]);
  });

  it('discovers only JournalEntry packs and never reads other pack types', async () => {
    const { service, reader } = makeService(
      new Map([
        ['dnd5e.rules', [grapplingJournal]],
        ['dnd5e.content24', []]
      ])
    );

    await service.searchJournalPages({ query: 'grapple' });
    expect(reader.readPacks).toEqual(['dnd5e.rules', 'dnd5e.content24']);
  });

  it('stops reading further packs once the limit is reached', async () => {
    const { service, reader } = makeService(
      new Map([
        ['dnd5e.rules', [grapplingJournal]],
        ['dnd5e.content24', [grapplingJournal]]
      ])
    );

    const matches = await service.searchJournalPages({ query: 'grapple', limit: 2 });
    expect(matches).toHaveLength(2);
    expect(reader.readPacks).toEqual(['dnd5e.rules']);
  });

  it('filters by pageTypes (empty list matches nothing)', async () => {
    const mixedJournal = makeJournal('j2', 'Handbook', [
      makePage('p1', 'Grappling', null, 'rule'),
      makePage('p2', 'Grappling Spells', null, 'spells')
    ]);
    const { service } = makeService(new Map([['dnd5e.rules', [mixedJournal]]]));

    const spellsOnly = await service.searchJournalPages({
      query: 'grappling',
      pageTypes: ['spells']
    });
    expect(spellsOnly.map(m => m.pageId)).toEqual(['p2']);

    const none = await service.searchJournalPages({ query: 'grappling', pageTypes: [] });
    expect(none).toEqual([]);
  });

  it('supports name-only search via searchContent: false', async () => {
    const { service } = makeService(new Map([['dnd5e.rules', [grapplingJournal]]]));

    const matches = await service.searchJournalPages({
      query: 'grappl',
      searchContent: false
    });
    expect(matches.map(m => m.matchedIn)).toEqual(['name']);
  });

  it('returns [] for a blank query without touching any pack', async () => {
    const { service, reader } = makeService(new Map([['dnd5e.rules', [grapplingJournal]]]));

    expect(await service.searchJournalPages({ query: '   ' })).toEqual([]);
    expect(reader.readPacks).toEqual([]);
  });

  it('resolves explicit packIds loudly', async () => {
    const { service } = makeService(new Map([['dnd5e.rules', [grapplingJournal]]]));

    const scoped = await service.searchJournalPages({
      query: 'grapple',
      packIds: ['dnd5e.rules']
    });
    expect(scoped).toHaveLength(2);

    await expect(
      service.searchJournalPages({ query: 'grapple', packIds: ['ghost'] })
    ).rejects.toThrow(PackNotFoundError);
    await expect(
      service.searchJournalPages({ query: 'grapple', packIds: ['dnd5e.items'] })
    ).rejects.toThrow(PackTypeMismatchError);
    await expect(
      service.searchJournalPages({ query: 'grapple', packIds: ['dnd5e.items'] })
    ).rejects.toThrow('Compendium pack is not an JournalEntry pack: dnd5e.items');
  });

  it('skips journals without pages', async () => {
    const { service } = makeService(
      new Map([['dnd5e.rules', [makeJournal('j3', 'Empty Journal', undefined)]]])
    );
    expect(await service.searchJournalPages({ query: 'grapple' })).toEqual([]);
  });
});
