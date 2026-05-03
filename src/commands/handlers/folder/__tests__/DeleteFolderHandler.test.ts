import { deleteFolderHandler } from '../DeleteFolderHandler';
import type { FoundryFolderDoc } from '../folderTypes';

function createMockFolder(): FoundryFolderDoc {
  return {
    id: 'f1',
    name: 'Doomed',
    type: 'Actor',
    color: null,
    description: null,
    sort: 0,
    folder: null,
    contents: [],
    children: [],
    getSubfolders: jest.fn(() => []),
    update: jest.fn(),
    delete: jest.fn()
  };
}

function setGame(folders: FoundryFolderDoc[]): void {
  (globalThis as Record<string, unknown>)['game'] = {
    folders: {
      contents: folders,
      get: jest.fn((id: string) => folders.find(f => f.id === id))
    }
  };
}

function clearGame(): void {
  delete (globalThis as Record<string, unknown>)['game'];
}

describe('deleteFolderHandler', () => {
  afterEach(() => {
    clearGame();
    jest.clearAllMocks();
  });

  it('should delete folder and return result', async () => {
    const folder = createMockFolder();
    (folder.delete as jest.Mock).mockResolvedValue(folder);
    setGame([folder]);

    const result = await deleteFolderHandler({ folderId: 'f1' });

    expect(folder.delete).toHaveBeenCalledWith({});
    expect(result).toEqual({ deleted: true, folderId: 'f1' });
  });

  it('should throw if folder not found', async () => {
    setGame([]);

    await expect(deleteFolderHandler({ folderId: 'missing' }))
      .rejects.toThrow('Folder not found: missing');
  });

  it('should pass deleteSubfolders option when true', async () => {
    const folder = createMockFolder();
    (folder.delete as jest.Mock).mockResolvedValue(folder);
    setGame([folder]);

    await deleteFolderHandler({ folderId: 'f1', deleteSubfolders: true });

    expect(folder.delete).toHaveBeenCalledWith({ deleteSubfolders: true });
  });

  it('should pass deleteContents option when true', async () => {
    const folder = createMockFolder();
    (folder.delete as jest.Mock).mockResolvedValue(folder);
    setGame([folder]);

    await deleteFolderHandler({ folderId: 'f1', deleteContents: true });

    expect(folder.delete).toHaveBeenCalledWith({ deleteContents: true });
  });

  it('should pass both options together', async () => {
    const folder = createMockFolder();
    (folder.delete as jest.Mock).mockResolvedValue(folder);
    setGame([folder]);

    await deleteFolderHandler({
      folderId: 'f1',
      deleteSubfolders: true,
      deleteContents: true
    });

    expect(folder.delete).toHaveBeenCalledWith({
      deleteSubfolders: true,
      deleteContents: true
    });
  });

  it('should pass options when explicitly false', async () => {
    const folder = createMockFolder();
    (folder.delete as jest.Mock).mockResolvedValue(folder);
    setGame([folder]);

    await deleteFolderHandler({
      folderId: 'f1',
      deleteSubfolders: false,
      deleteContents: false
    });

    expect(folder.delete).toHaveBeenCalledWith({
      deleteSubfolders: false,
      deleteContents: false
    });
  });

  it('should pass empty options when neither flag provided', async () => {
    const folder = createMockFolder();
    (folder.delete as jest.Mock).mockResolvedValue(folder);
    setGame([folder]);

    await deleteFolderHandler({ folderId: 'f1' });

    expect(folder.delete).toHaveBeenCalledWith({});
  });

  it('should propagate folder.delete rejection', async () => {
    const folder = createMockFolder();
    (folder.delete as jest.Mock).mockRejectedValue(new Error('cannot delete'));
    setGame([folder]);

    await expect(deleteFolderHandler({ folderId: 'f1' }))
      .rejects.toThrow('cannot delete');
  });
});
