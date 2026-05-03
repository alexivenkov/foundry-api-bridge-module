import { updateFolderHandler } from '../UpdateFolderHandler';
import type { FoundryFolderDoc } from '../folderTypes';

function createMockFolder(): FoundryFolderDoc {
  return {
    id: 'f1',
    name: 'Original',
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

describe('updateFolderHandler', () => {
  afterEach(() => {
    clearGame();
    jest.clearAllMocks();
  });

  it('should update folder name', async () => {
    const folder = createMockFolder();
    const updated = { ...folder, name: 'New Name' };
    (folder.update as jest.Mock).mockResolvedValue(updated);
    setGame([folder]);

    const result = await updateFolderHandler({ folderId: 'f1', name: 'New Name' });

    expect(folder.update).toHaveBeenCalledWith({ name: 'New Name' });
    expect(result.name).toBe('New Name');
  });

  it('should throw if folder not found', async () => {
    setGame([]);

    await expect(updateFolderHandler({ folderId: 'missing', name: 'X' }))
      .rejects.toThrow('Folder not found: missing');
  });

  it('should move folder to root when parentId is null', async () => {
    const folder = createMockFolder();
    (folder.update as jest.Mock).mockResolvedValue({ ...folder, folder: null });
    setGame([folder]);

    await updateFolderHandler({ folderId: 'f1', parentId: null });

    expect(folder.update).toHaveBeenCalledWith({ folder: null });
  });

  it('should not include folder field when parentId is undefined', async () => {
    const folder = createMockFolder();
    (folder.update as jest.Mock).mockResolvedValue(folder);
    setGame([folder]);

    await updateFolderHandler({ folderId: 'f1', name: 'Renamed' });

    const call = (folder.update as jest.Mock).mock.calls[0][0] as Record<string, unknown>;
    expect(call).not.toHaveProperty('folder');
    expect(call).toEqual({ name: 'Renamed' });
  });

  it('should set parent folder when parentId is a string', async () => {
    const folder = createMockFolder();
    (folder.update as jest.Mock).mockResolvedValue({ ...folder, folder: { id: 'p1' } });
    setGame([folder]);

    await updateFolderHandler({ folderId: 'f1', parentId: 'p1' });

    expect(folder.update).toHaveBeenCalledWith({ folder: 'p1' });
  });

  it('should update all optional fields together', async () => {
    const folder = createMockFolder();
    (folder.update as jest.Mock).mockResolvedValue({
      ...folder,
      name: 'Renamed',
      color: '#ff0000',
      description: 'New desc',
      sort: 10,
      folder: { id: 'parent' }
    });
    setGame([folder]);

    const result = await updateFolderHandler({
      folderId: 'f1',
      name: 'Renamed',
      parentId: 'parent',
      color: '#ff0000',
      description: 'New desc',
      sort: 10
    });

    expect(folder.update).toHaveBeenCalledWith({
      name: 'Renamed',
      folder: 'parent',
      color: '#ff0000',
      description: 'New desc',
      sort: 10
    });
    expect(result.name).toBe('Renamed');
    expect(result.parentId).toBe('parent');
  });

  it('should send empty object when no fields provided', async () => {
    const folder = createMockFolder();
    (folder.update as jest.Mock).mockResolvedValue(folder);
    setGame([folder]);

    await updateFolderHandler({ folderId: 'f1' });

    expect(folder.update).toHaveBeenCalledWith({});
  });

  it('should partial update without affecting unspecified fields', async () => {
    const folder = createMockFolder();
    (folder.update as jest.Mock).mockResolvedValue(folder);
    setGame([folder]);

    await updateFolderHandler({ folderId: 'f1', color: '#000000' });

    const call = (folder.update as jest.Mock).mock.calls[0][0] as Record<string, unknown>;
    expect(call).toEqual({ color: '#000000' });
    expect(call).not.toHaveProperty('name');
    expect(call).not.toHaveProperty('description');
    expect(call).not.toHaveProperty('sort');
    expect(call).not.toHaveProperty('folder');
  });
});
