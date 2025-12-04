import { createJournalHandler } from '@/commands/handlers/CreateJournalHandler';
import { updateJournalHandler } from '@/commands/handlers/UpdateJournalHandler';
import { deleteJournalHandler } from '@/commands/handlers/DeleteJournalHandler';
import { createJournalPageHandler } from '@/commands/handlers/CreateJournalPageHandler';
import { updateJournalPageHandler } from '@/commands/handlers/UpdateJournalPageHandler';
import { deleteJournalPageHandler } from '@/commands/handlers/DeleteJournalPageHandler';

interface MockPage {
  id: string;
  name: string;
  type: string;
  update: jest.Mock;
}

interface MockJournal {
  id: string;
  name: string;
  folder: { id: string } | null;
  pages: {
    get: jest.Mock;
    map: jest.Mock;
  };
  update: jest.Mock;
  delete: jest.Mock;
  createEmbeddedDocuments: jest.Mock;
  deleteEmbeddedDocuments: jest.Mock;
}

const createMockPage = (overrides: Partial<MockPage> = {}): MockPage => ({
  id: 'page-123',
  name: 'Test Page',
  type: 'text',
  update: jest.fn(),
  ...overrides
});

const createMockJournal = (overrides: Partial<MockJournal> = {}): MockJournal => {
  const mockPage = createMockPage();
  return {
    id: 'journal-123',
    name: 'Test Journal',
    folder: null,
    pages: {
      get: jest.fn().mockReturnValue(mockPage),
      map: jest.fn().mockImplementation((fn) => [fn(mockPage)])
    },
    update: jest.fn(),
    delete: jest.fn(),
    createEmbeddedDocuments: jest.fn(),
    deleteEmbeddedDocuments: jest.fn(),
    ...overrides
  };
};

const mockJournalEntry = {
  create: jest.fn()
};

const mockGame = {
  journal: {
    get: jest.fn()
  }
};

(global as Record<string, unknown>)['game'] = mockGame;
(global as Record<string, unknown>)['JournalEntry'] = mockJournalEntry;

describe('Journal Handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createJournalHandler', () => {
    it('creates a journal with minimal params', async () => {
      const mockJournal = createMockJournal();
      mockJournalEntry.create.mockResolvedValue(mockJournal);

      const result = await createJournalHandler({ name: 'New Journal' });

      expect(mockJournalEntry.create).toHaveBeenCalledWith({ name: 'New Journal' });
      expect(result).toEqual({
        id: 'journal-123',
        name: 'Test Journal',
        folder: null,
        pages: [{ id: 'page-123', name: 'Test Page', type: 'text' }]
      });
    });

    it('creates a journal with folder', async () => {
      const mockJournal = createMockJournal({ folder: { id: 'folder-456' } });
      mockJournalEntry.create.mockResolvedValue(mockJournal);

      const result = await createJournalHandler({
        name: 'New Journal',
        folder: 'folder-456'
      });

      expect(mockJournalEntry.create).toHaveBeenCalledWith({
        name: 'New Journal',
        folder: 'folder-456'
      });
      expect(result.folder).toBe('folder-456');
    });

    it('creates a journal with initial text content', async () => {
      const mockJournal = createMockJournal();
      mockJournalEntry.create.mockResolvedValue(mockJournal);

      await createJournalHandler({
        name: 'Session Notes',
        content: '<p>Today we explored the dungeon.</p>'
      });

      expect(mockJournalEntry.create).toHaveBeenCalledWith({
        name: 'Session Notes',
        pages: [{
          name: 'Session Notes',
          type: 'text',
          text: { content: '<p>Today we explored the dungeon.</p>' }
        }]
      });
    });

    it('creates a journal with image page type', async () => {
      const mockJournal = createMockJournal();
      mockJournalEntry.create.mockResolvedValue(mockJournal);

      await createJournalHandler({
        name: 'Map',
        content: 'ignored-for-image',
        pageType: 'image'
      });

      expect(mockJournalEntry.create).toHaveBeenCalledWith({
        name: 'Map',
        pages: [{
          name: 'Map',
          type: 'image'
        }]
      });
    });
  });

  describe('updateJournalHandler', () => {
    it('throws error when journal not found', async () => {
      mockGame.journal.get.mockReturnValue(undefined);

      await expect(
        updateJournalHandler({ journalId: 'nonexistent' })
      ).rejects.toThrow('Journal not found: nonexistent');
    });

    it('updates journal name', async () => {
      const mockJournal = createMockJournal();
      mockJournal.update.mockResolvedValue(mockJournal);
      mockGame.journal.get.mockReturnValue(mockJournal);

      await updateJournalHandler({
        journalId: 'journal-123',
        name: 'Updated Name'
      });

      expect(mockJournal.update).toHaveBeenCalledWith({ name: 'Updated Name' });
    });

    it('updates journal folder', async () => {
      const mockJournal = createMockJournal();
      mockJournal.update.mockResolvedValue(mockJournal);
      mockGame.journal.get.mockReturnValue(mockJournal);

      await updateJournalHandler({
        journalId: 'journal-123',
        folder: 'new-folder'
      });

      expect(mockJournal.update).toHaveBeenCalledWith({ folder: 'new-folder' });
    });

    it('returns updated journal result', async () => {
      const mockJournal = createMockJournal({ name: 'Updated Journal' });
      mockJournal.update.mockResolvedValue(mockJournal);
      mockGame.journal.get.mockReturnValue(mockJournal);

      const result = await updateJournalHandler({
        journalId: 'journal-123',
        name: 'Updated Journal'
      });

      expect(result.name).toBe('Updated Journal');
    });
  });

  describe('deleteJournalHandler', () => {
    it('throws error when journal not found', async () => {
      mockGame.journal.get.mockReturnValue(undefined);

      await expect(
        deleteJournalHandler({ journalId: 'nonexistent' })
      ).rejects.toThrow('Journal not found: nonexistent');
    });

    it('deletes journal and returns success', async () => {
      const mockJournal = createMockJournal();
      mockJournal.delete.mockResolvedValue(mockJournal);
      mockGame.journal.get.mockReturnValue(mockJournal);

      const result = await deleteJournalHandler({ journalId: 'journal-123' });

      expect(mockJournal.delete).toHaveBeenCalled();
      expect(result).toEqual({ deleted: true });
    });
  });

  describe('createJournalPageHandler', () => {
    it('throws error when journal not found', async () => {
      mockGame.journal.get.mockReturnValue(undefined);

      await expect(
        createJournalPageHandler({ journalId: 'nonexistent', name: 'Page' })
      ).rejects.toThrow('Journal not found: nonexistent');
    });

    it('creates a text page with content', async () => {
      const mockPage = createMockPage();
      const mockJournal = createMockJournal();
      mockJournal.createEmbeddedDocuments.mockResolvedValue([mockPage]);
      mockGame.journal.get.mockReturnValue(mockJournal);

      const result = await createJournalPageHandler({
        journalId: 'journal-123',
        name: 'New Page',
        content: '<p>Page content</p>'
      });

      expect(mockJournal.createEmbeddedDocuments).toHaveBeenCalledWith(
        'JournalEntryPage',
        [{
          name: 'New Page',
          type: 'text',
          text: { content: '<p>Page content</p>' }
        }]
      );
      expect(result).toEqual({
        id: 'page-123',
        name: 'Test Page',
        type: 'text'
      });
    });

    it('creates an image page', async () => {
      const mockPage = createMockPage({ type: 'image' });
      const mockJournal = createMockJournal();
      mockJournal.createEmbeddedDocuments.mockResolvedValue([mockPage]);
      mockGame.journal.get.mockReturnValue(mockJournal);

      await createJournalPageHandler({
        journalId: 'journal-123',
        name: 'Map Page',
        type: 'image'
      });

      expect(mockJournal.createEmbeddedDocuments).toHaveBeenCalledWith(
        'JournalEntryPage',
        [{ name: 'Map Page', type: 'image' }]
      );
    });

    it('throws error when page creation fails', async () => {
      const mockJournal = createMockJournal();
      mockJournal.createEmbeddedDocuments.mockResolvedValue([]);
      mockGame.journal.get.mockReturnValue(mockJournal);

      await expect(
        createJournalPageHandler({ journalId: 'journal-123', name: 'Page' })
      ).rejects.toThrow('Failed to create journal page');
    });
  });

  describe('updateJournalPageHandler', () => {
    it('throws error when journal not found', async () => {
      mockGame.journal.get.mockReturnValue(undefined);

      await expect(
        updateJournalPageHandler({
          journalId: 'nonexistent',
          pageId: 'page-123'
        })
      ).rejects.toThrow('Journal not found: nonexistent');
    });

    it('throws error when page not found', async () => {
      const mockJournal = createMockJournal();
      mockJournal.pages.get.mockReturnValue(undefined);
      mockGame.journal.get.mockReturnValue(mockJournal);

      await expect(
        updateJournalPageHandler({
          journalId: 'journal-123',
          pageId: 'nonexistent'
        })
      ).rejects.toThrow('Page not found: nonexistent');
    });

    it('updates page name', async () => {
      const mockPage = createMockPage();
      mockPage.update.mockResolvedValue(mockPage);
      const mockJournal = createMockJournal();
      mockJournal.pages.get.mockReturnValue(mockPage);
      mockGame.journal.get.mockReturnValue(mockJournal);

      await updateJournalPageHandler({
        journalId: 'journal-123',
        pageId: 'page-123',
        name: 'Renamed Page'
      });

      expect(mockPage.update).toHaveBeenCalledWith({ name: 'Renamed Page' });
    });

    it('updates page content', async () => {
      const mockPage = createMockPage();
      mockPage.update.mockResolvedValue(mockPage);
      const mockJournal = createMockJournal();
      mockJournal.pages.get.mockReturnValue(mockPage);
      mockGame.journal.get.mockReturnValue(mockJournal);

      await updateJournalPageHandler({
        journalId: 'journal-123',
        pageId: 'page-123',
        content: '<p>Updated content</p>'
      });

      expect(mockPage.update).toHaveBeenCalledWith({
        text: { content: '<p>Updated content</p>' }
      });
    });

    it('returns updated page result', async () => {
      const mockPage = createMockPage({ name: 'Updated Page' });
      mockPage.update.mockResolvedValue(mockPage);
      const mockJournal = createMockJournal();
      mockJournal.pages.get.mockReturnValue(mockPage);
      mockGame.journal.get.mockReturnValue(mockJournal);

      const result = await updateJournalPageHandler({
        journalId: 'journal-123',
        pageId: 'page-123',
        name: 'Updated Page'
      });

      expect(result.name).toBe('Updated Page');
    });
  });

  describe('deleteJournalPageHandler', () => {
    it('throws error when journal not found', async () => {
      mockGame.journal.get.mockReturnValue(undefined);

      await expect(
        deleteJournalPageHandler({
          journalId: 'nonexistent',
          pageId: 'page-123'
        })
      ).rejects.toThrow('Journal not found: nonexistent');
    });

    it('throws error when page not found', async () => {
      const mockJournal = createMockJournal();
      mockJournal.pages.get.mockReturnValue(undefined);
      mockGame.journal.get.mockReturnValue(mockJournal);

      await expect(
        deleteJournalPageHandler({
          journalId: 'journal-123',
          pageId: 'nonexistent'
        })
      ).rejects.toThrow('Page not found: nonexistent');
    });

    it('deletes page and returns success', async () => {
      const mockPage = createMockPage();
      const mockJournal = createMockJournal();
      mockJournal.pages.get.mockReturnValue(mockPage);
      mockJournal.deleteEmbeddedDocuments.mockResolvedValue([mockPage]);
      mockGame.journal.get.mockReturnValue(mockJournal);

      const result = await deleteJournalPageHandler({
        journalId: 'journal-123',
        pageId: 'page-123'
      });

      expect(mockJournal.deleteEmbeddedDocuments).toHaveBeenCalledWith(
        'JournalEntryPage',
        ['page-123']
      );
      expect(result).toEqual({ deleted: true });
    });
  });
});