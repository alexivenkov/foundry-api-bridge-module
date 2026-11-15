import {
  htmlToSearchText,
  journalPageUuid,
  searchJournals,
  snippetAround,
  type JournalSearchCriteria,
  type JournalSearchPage,
  type JournalSearchSource
} from '..';

function page(overrides: Partial<JournalSearchPage> = {}): JournalSearchPage {
  return { id: 'p1', name: 'Intro', type: 'text', text: null, markdown: null, ...overrides };
}

function journal(overrides: Partial<JournalSearchSource> = {}): JournalSearchSource {
  return { id: 'j1', uuid: 'JournalEntry.j1', name: 'Quest Log', pages: [], ...overrides };
}

function criteria(overrides: Partial<JournalSearchCriteria> = {}): JournalSearchCriteria {
  return { query: 'goblin', searchContent: true, limit: 25, offset: 0, ...overrides };
}

describe('htmlToSearchText', () => {
  it('turns tags into spaces, decodes the editor entities and collapses whitespace', () => {
    expect(htmlToSearchText('<h1>Cave</h1><p>Goblins&nbsp;&amp; wolves &lt;3&gt; &quot;run&quot; &#39;now&#039;</p>')).toBe(
      `Cave Goblins & wolves <3> "run" 'now'`
    );
  });

  it('decodes an escaped entity only once', () => {
    expect(htmlToSearchText('&amp;lt;b&amp;gt;')).toBe('&lt;b&gt;');
  });
});

describe('snippetAround', () => {
  it('returns null when the needle does not occur', () => {
    expect(snippetAround('nothing here', 'goblin')).toBeNull();
  });

  it('marks cut text with an ellipsis on the side it was cut', () => {
    const text = `${'a'.repeat(20)} Goblin ${'b'.repeat(20)}`;

    expect(snippetAround(text, 'goblin', 5)).toBe('…aaaa Goblin bbbb…');
    expect(snippetAround('Goblin camp', 'goblin', 100)).toBe('Goblin camp');
  });
});

describe('journalPageUuid', () => {
  it('is the uuid the core builds for an embedded page', () => {
    expect(journalPageUuid('JournalEntry.j1', 'p1')).toBe('JournalEntry.j1.JournalEntryPage.p1');
  });
});

describe('searchJournals', () => {
  const library = [
    journal({
      id: 'j1',
      uuid: 'JournalEntry.j1',
      name: 'Goblin Cave',
      pages: [
        page({ id: 'p1', name: 'Entrance', text: '<p>A <b>goblin</b> guard sleeps.</p>' }),
        page({ id: 'p2', name: 'Goblin King', type: 'image' }),
        page({ id: 'p3', name: 'Notes', text: null, markdown: '# The goblin hoard' })
      ]
    }),
    journal({
      id: 'j2',
      uuid: 'JournalEntry.j2',
      name: 'Town',
      pages: [page({ id: 'p4', name: 'Inn', text: '<p>No monsters.</p>' })]
    })
  ];

  it('reports the journal name, then each page by name before text, in the order they come', () => {
    const outcome = searchJournals(library, criteria());

    expect(outcome.hasMore).toBe(false);
    expect(outcome.matches).toEqual([
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
        snippet: 'A goblin guard sleeps.'
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
      },
      {
        journalId: 'j1',
        journalName: 'Goblin Cave',
        pageId: 'p3',
        pageName: 'Notes',
        pageType: 'text',
        uuid: 'JournalEntry.j1.JournalEntryPage.p3',
        matchedIn: 'content',
        snippet: '# The goblin hoard'
      }
    ]);
  });

  it('matches case-insensitively and ignores surrounding blanks of the query', () => {
    expect(searchJournals(library, criteria({ query: '  MONSTERS ' })).matches.map((match) => match.pageId)).toEqual([
      'p4'
    ]);
  });

  it('leaves page text alone when content search is off', () => {
    const outcome = searchJournals(library, criteria({ searchContent: false }));

    expect(outcome.matches.map((match) => match.matchedIn)).toEqual(['journal', 'name']);
  });

  it('keeps only pages of the named types and then drops journal-name matches', () => {
    const outcome = searchJournals(library, criteria({ pageTypes: ['image'] }));

    expect(outcome.matches.map((match) => match.pageId)).toEqual(['p2']);
  });

  it('pages through the matches and says whether more follow', () => {
    expect(searchJournals(library, criteria({ limit: 2 }))).toMatchObject({ hasMore: true });
    expect(searchJournals(library, criteria({ limit: 2 })).matches.map((match) => match.pageId)).toEqual([null, 'p1']);

    const second = searchJournals(library, criteria({ limit: 2, offset: 2 }));
    expect(second.matches.map((match) => match.pageId)).toEqual(['p2', 'p3']);
    expect(second.hasMore).toBe(false);

    expect(searchJournals(library, criteria({ offset: 10 }))).toEqual({ matches: [], hasMore: false });
  });

  it('finds nothing for a blank query', () => {
    expect(searchJournals(library, criteria({ query: '   ' }))).toEqual({ matches: [], hasMore: false });
  });

  it('does not match inside HTML tags or attributes', () => {
    const tagged = [journal({ name: 'J', pages: [page({ text: '<p class="goblin">Plain</p>' })] })];

    expect(searchJournals(tagged, criteria()).matches).toEqual([]);
  });
});
