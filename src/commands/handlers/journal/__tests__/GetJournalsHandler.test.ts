import { getJournalsHandler } from '../GetJournalsHandler';

interface MockPage {
  id: string;
  name: string;
  type: string | number;
  src: string | undefined;
  text: { content: string | undefined; markdown: string | undefined };
}

interface MockJournal {
  id: string;
  uuid: string;
  name: string;
  folder: { name: string } | null;
  pages: { forEach: jest.Mock };
}

const mockEnrichHTML = jest.fn<Promise<string>, [string]>();

function createMockPage(overrides?: Partial<MockPage>): MockPage {
  return {
    id: 'page-1',
    name: 'Page One',
    type: 'text',
    src: undefined,
    text: { content: '<p>Hello</p>', markdown: '# Hello' },
    ...overrides
  };
}

function createMockJournal(pages: MockPage[] = [], overrides?: Partial<MockJournal>): MockJournal {
  return {
    id: 'journal-1',
    uuid: 'JournalEntry.journal-1',
    name: 'Test Journal',
    folder: { name: 'Adventures' },
    pages: {
      forEach: jest.fn((fn: (page: MockPage) => void) => { pages.forEach(fn); })
    },
    ...overrides
  };
}

function setGame(journals: MockJournal[] | undefined): void {
  const journal = journals !== undefined
    ? { forEach: jest.fn((fn: (j: MockJournal) => void) => { journals.forEach(fn); }) }
    : undefined;
  (globalThis as Record<string, unknown>)['game'] = { journal };
  (globalThis as Record<string, unknown>)['TextEditor'] = { enrichHTML: mockEnrichHTML };
}

function clearGame(): void {
  delete (globalThis as Record<string, unknown>)['game'];
  delete (globalThis as Record<string, unknown>)['TextEditor'];
}

describe('getJournalsHandler', () => {
  beforeEach(() => {
    mockEnrichHTML.mockImplementation(async (content: string) => `<enriched>${content}</enriched>`);
  });

  afterEach(() => {
    clearGame();
    jest.clearAllMocks();
  });

  it('should return all journals with pages', async () => {
    const pages = [
      createMockPage({ id: 'p1', name: 'Intro', text: { content: '<p>Start</p>', markdown: '# Start' } }),
      createMockPage({ id: 'p2', name: 'Chapter 1', type: 'image', text: { content: undefined, markdown: undefined } })
    ];
    setGame([
      createMockJournal(pages, { id: 'j1', uuid: 'JE.j1', name: 'Adventure Log', folder: { name: 'Logs' } })
    ]);

    const result = await getJournalsHandler({} as Record<string, never>);

    expect(result).toEqual([{
      id: 'j1',
      uuid: 'JE.j1',
      name: 'Adventure Log',
      folder: 'Logs',
      pages: [
        { id: 'p1', name: 'Intro', type: 'text', text: '<p>Start</p>', markdown: '# Start', enrichedText: '<enriched><p>Start</p></enriched>', src: null },
        { id: 'p2', name: 'Chapter 1', type: 'image', text: null, markdown: null, enrichedText: null, src: null }
      ]
    }]);
  });

  it('should return empty array when journal collection is undefined', async () => {
    setGame(undefined);

    const result = await getJournalsHandler({} as Record<string, never>);

    expect(result).toEqual([]);
  });

  it('should return empty array for empty collection', async () => {
    setGame([]);

    const result = await getJournalsHandler({} as Record<string, never>);

    expect(result).toEqual([]);
  });

  it('should return journal with empty pages', async () => {
    setGame([createMockJournal([], { id: 'j1', uuid: 'JE.j1', name: 'Empty' })]);

    const result = await getJournalsHandler({} as Record<string, never>);

    expect(result[0]?.pages).toEqual([]);
  });

  it('should handle page with null text and markdown', async () => {
    const page = createMockPage({ text: { content: undefined, markdown: undefined } });
    setGame([createMockJournal([page])]);

    const result = await getJournalsHandler({} as Record<string, never>);

    expect(result[0]?.pages[0]?.text).toBeNull();
    expect(result[0]?.pages[0]?.markdown).toBeNull();
    expect(result[0]?.pages[0]?.enrichedText).toBeNull();
  });

  it('should convert numeric page type to string', async () => {
    const page = createMockPage({ type: 42 });
    setGame([createMockJournal([page])]);

    const result = await getJournalsHandler({} as Record<string, never>);

    expect(result[0]?.pages[0]?.type).toBe('42');
  });

  it('should return null folder when journal has no folder', async () => {
    setGame([createMockJournal([], { folder: null })]);

    const result = await getJournalsHandler({} as Record<string, never>);

    expect(result[0]?.folder).toBeNull();
  });

  it('should handle multiple journals', async () => {
    setGame([
      createMockJournal([], { id: 'j1', uuid: 'JE.j1', name: 'First' }),
      createMockJournal([], { id: 'j2', uuid: 'JE.j2', name: 'Second' }),
      createMockJournal([], { id: 'j3', uuid: 'JE.j3', name: 'Third' })
    ]);

    const result = await getJournalsHandler({} as Record<string, never>);

    expect(result).toHaveLength(3);
    expect(result.map(j => j.name)).toEqual(['First', 'Second', 'Third']);
  });

  it('should enrich text content via TextEditor.enrichHTML', async () => {
    const page = createMockPage({ text: { content: '<p>@UUID[Actor.123]{Hero}</p>', markdown: undefined } });
    setGame([createMockJournal([page])]);

    const result = await getJournalsHandler({} as Record<string, never>);

    expect(mockEnrichHTML).toHaveBeenCalledWith('<p>@UUID[Actor.123]{Hero}</p>', { secrets: true });
    expect(result[0]?.pages[0]?.enrichedText).toBe('<enriched><p>@UUID[Actor.123]{Hero}</p></enriched>');
    expect(result[0]?.pages[0]?.text).toBe('<p>@UUID[Actor.123]{Hero}</p>');
  });

  it('should fallback to raw text when enrichHTML throws', async () => {
    mockEnrichHTML.mockRejectedValue(new Error('Enrichment failed'));
    const page = createMockPage({ text: { content: '<p>Content</p>', markdown: undefined } });
    setGame([createMockJournal([page])]);

    const result = await getJournalsHandler({} as Record<string, never>);

    expect(result[0]?.pages[0]?.enrichedText).toBe('<p>Content</p>');
  });

  it('should return src field for pages', async () => {
    const page = createMockPage({ type: 'image', src: 'images/map.png', text: { content: undefined, markdown: undefined } });
    setGame([createMockJournal([page])]);

    const result = await getJournalsHandler({} as Record<string, never>);

    expect(result[0]?.pages[0]?.src).toBe('images/map.png');
  });

  it('should return null src when page has no src', async () => {
    const page = createMockPage();
    setGame([createMockJournal([page])]);

    const result = await getJournalsHandler({} as Record<string, never>);

    expect(result[0]?.pages[0]?.src).toBeNull();
  });

  it('should work without TextEditor global', async () => {
    const page = createMockPage({ text: { content: '<p>Content</p>', markdown: undefined } });
    const journal = createMockJournal([page]);
    const journals = [journal];
    (globalThis as Record<string, unknown>)['game'] = {
      journal: { forEach: jest.fn((fn: (j: MockJournal) => void) => { journals.forEach(fn); }) }
    };
    delete (globalThis as Record<string, unknown>)['TextEditor'];

    const result = await getJournalsHandler({} as Record<string, never>);

    expect(result[0]?.pages[0]?.enrichedText).toBeNull();
    expect(result[0]?.pages[0]?.text).toBe('<p>Content</p>');
  });
});
