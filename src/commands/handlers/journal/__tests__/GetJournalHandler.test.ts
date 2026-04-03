import { getJournalHandler } from '../GetJournalHandler';

interface MockPage {
  id: string;
  name: string;
  type: string;
  text: { content: string | undefined; markdown: string | undefined };
}

interface MockJournal {
  id: string;
  uuid: string;
  name: string;
  folder: { name: string } | null;
  pages: { forEach: jest.Mock };
}

function createMockPage(overrides?: Partial<MockPage>): MockPage {
  return {
    id: 'page-1',
    name: 'Page One',
    type: 'text',
    text: { content: '<p>Content</p>', markdown: '# Content' },
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

function setGame(journals: Map<string, MockJournal>): void {
  (globalThis as Record<string, unknown>)['game'] = {
    journal: { get: jest.fn((id: string) => journals.get(id)) }
  };
}

function clearGame(): void {
  delete (globalThis as Record<string, unknown>)['game'];
}

describe('getJournalHandler', () => {
  afterEach(clearGame);

  it('should return full journal with pages', async () => {
    const pages = [
      createMockPage({ id: 'p1', name: 'Intro' }),
      createMockPage({ id: 'p2', name: 'Body' })
    ];
    const journal = createMockJournal(pages, { id: 'j1', uuid: 'JE.j1', name: 'Quest Log' });
    setGame(new Map([['j1', journal]]));

    const result = await getJournalHandler({ journalId: 'j1' });

    expect(result.id).toBe('j1');
    expect(result.uuid).toBe('JE.j1');
    expect(result.name).toBe('Quest Log');
    expect(result.folder).toBe('Adventures');
    expect(result.pages).toHaveLength(2);
  });

  it('should reject when journal not found', async () => {
    setGame(new Map());

    await expect(getJournalHandler({ journalId: 'nonexistent' }))
      .rejects.toThrow('Journal not found: nonexistent');
  });

  it('should return journal with multiple pages including content', async () => {
    const pages = [
      createMockPage({ id: 'p1', text: { content: '<p>Hello</p>', markdown: '# Hello' } }),
      createMockPage({ id: 'p2', text: { content: undefined, markdown: undefined } })
    ];
    const journal = createMockJournal(pages);
    setGame(new Map([['journal-1', journal]]));

    const result = await getJournalHandler({ journalId: 'journal-1' });

    expect(result.pages[0]?.text).toBe('<p>Hello</p>');
    expect(result.pages[0]?.markdown).toBe('# Hello');
    expect(result.pages[1]?.text).toBeNull();
    expect(result.pages[1]?.markdown).toBeNull();
  });

  it('should reject with descriptive error for empty journalId', async () => {
    setGame(new Map());

    await expect(getJournalHandler({ journalId: '' }))
      .rejects.toThrow('Journal not found: ');
  });
});
