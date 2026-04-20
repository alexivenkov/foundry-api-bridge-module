import { showJournalHandler } from '../ShowJournalHandler';

interface MockPage {
  id: string;
  name: string;
  type: string;
}

interface MockJournal {
  id: string;
  name: string;
  pages: { get: jest.Mock };
}

function createMockPage(overrides?: Partial<MockPage>): MockPage {
  return {
    id: 'page-1',
    name: 'Page One',
    type: 'text',
    ...overrides
  };
}

function createMockJournal(overrides?: Partial<MockJournal>): MockJournal {
  return {
    id: 'journal-1',
    name: 'Test Journal',
    pages: { get: jest.fn() },
    ...overrides
  };
}

const mockJournalShow = jest.fn().mockResolvedValue(undefined);

function setGame(journals: Map<string, MockJournal>): void {
  (globalThis as Record<string, unknown>)['game'] = {
    journal: { get: jest.fn((id: string) => journals.get(id)) }
  };
  (globalThis as Record<string, unknown>)['Journal'] = {
    show: mockJournalShow
  };
}

function clearGame(): void {
  delete (globalThis as Record<string, unknown>)['game'];
  delete (globalThis as Record<string, unknown>)['Journal'];
}

describe('showJournalHandler', () => {
  afterEach(() => {
    clearGame();
    jest.clearAllMocks();
  });

  it('should show journal to all players', async () => {
    const journal = createMockJournal();
    setGame(new Map([['journal-1', journal]]));

    const result = await showJournalHandler({ journalId: 'journal-1' });

    expect(mockJournalShow).toHaveBeenCalledWith(journal, {});
    expect(result).toEqual({
      shown: true,
      journalId: 'journal-1',
      journalName: 'Test Journal'
    });
  });

  it('should show specific page', async () => {
    const page = createMockPage({ id: 'page-1', name: 'Intro' });
    const journal = createMockJournal();
    journal.pages.get.mockReturnValue(page);
    setGame(new Map([['journal-1', journal]]));

    const result = await showJournalHandler({
      journalId: 'journal-1',
      pageId: 'page-1'
    });

    expect(mockJournalShow).toHaveBeenCalledWith(page, {});
    expect(result).toEqual({
      shown: true,
      journalId: 'journal-1',
      journalName: 'Test Journal',
      pageId: 'page-1'
    });
  });

  it('should force show (override permissions)', async () => {
    const journal = createMockJournal();
    setGame(new Map([['journal-1', journal]]));

    await showJournalHandler({
      journalId: 'journal-1',
      force: true
    });

    expect(mockJournalShow).toHaveBeenCalledWith(journal, { force: true });
  });

  it('should show to specific users', async () => {
    const journal = createMockJournal();
    setGame(new Map([['journal-1', journal]]));

    await showJournalHandler({
      journalId: 'journal-1',
      users: ['user-1', 'user-2']
    });

    expect(mockJournalShow).toHaveBeenCalledWith(journal, {
      users: ['user-1', 'user-2']
    });
  });

  it('should combine force and users options', async () => {
    const journal = createMockJournal();
    setGame(new Map([['journal-1', journal]]));

    await showJournalHandler({
      journalId: 'journal-1',
      force: true,
      users: ['user-1']
    });

    expect(mockJournalShow).toHaveBeenCalledWith(journal, {
      force: true,
      users: ['user-1']
    });
  });

  it('should throw when journal not found', async () => {
    setGame(new Map());

    await expect(
      showJournalHandler({ journalId: 'nonexistent' })
    ).rejects.toThrow('Journal not found: nonexistent');
  });

  it('should throw when page not found', async () => {
    const journal = createMockJournal();
    journal.pages.get.mockReturnValue(undefined);
    setGame(new Map([['journal-1', journal]]));

    await expect(
      showJournalHandler({ journalId: 'journal-1', pageId: 'nonexistent' })
    ).rejects.toThrow('Page not found: nonexistent');
  });

  it('should not set force when false', async () => {
    const journal = createMockJournal();
    setGame(new Map([['journal-1', journal]]));

    await showJournalHandler({
      journalId: 'journal-1',
      force: false
    });

    expect(mockJournalShow).toHaveBeenCalledWith(journal, {});
  });
});
