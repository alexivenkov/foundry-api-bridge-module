import { getFolderHandler } from '../GetFolderHandler';
import type { FoundryFolderDoc } from '../folderTypes';

interface MockFolderInput {
  id: string;
  name: string;
  type: string;
  color?: string | null;
  description?: string | null;
  sort?: number;
  parentId?: string | null;
  children?: FoundryFolderDoc[];
  contents?: ReadonlyArray<{ id: string }>;
}

function createMockFolder(input: MockFolderInput): FoundryFolderDoc {
  return {
    id: input.id,
    name: input.name,
    type: input.type,
    color: input.color ?? null,
    description: input.description ?? null,
    sort: input.sort ?? 0,
    folder: input.parentId ? { id: input.parentId } : null,
    contents: input.contents ?? [],
    children: input.children ?? [],
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

describe('getFolderHandler', () => {
  afterEach(clearGame);

  it('should return folder by id with default options (subfolders included)', async () => {
    const root = createMockFolder({ id: 'root', name: 'Root', type: 'Actor' });
    setGame([root]);

    const result = await getFolderHandler({ folderId: 'root' });

    expect(result.id).toBe('root');
    expect(result.name).toBe('Root');
    expect(result.subfolders).toEqual([]);
    expect(result.contentIds).toBeUndefined();
  });

  it('should throw if folder not found', async () => {
    setGame([]);

    await expect(getFolderHandler({ folderId: 'missing' }))
      .rejects.toThrow('Folder not found: missing');
  });

  it('should include nested subfolders recursively when includeSubfolders=true (default)', async () => {
    const grandchild = createMockFolder({ id: 'gc', name: 'GrandChild', type: 'Actor' });
    const child = createMockFolder({ id: 'c', name: 'Child', type: 'Actor', children: [grandchild] });
    const root = createMockFolder({ id: 'r', name: 'Root', type: 'Actor', children: [child] });
    setGame([root, child, grandchild]);

    const result = await getFolderHandler({ folderId: 'r' });

    expect(result.subfolders).toHaveLength(1);
    expect(result.subfolders[0]?.id).toBe('c');
    expect(result.subfolders[0]?.subfolders).toHaveLength(1);
    expect(result.subfolders[0]?.subfolders[0]?.id).toBe('gc');
    expect(result.subfolders[0]?.subfolders[0]?.subfolders).toEqual([]);
  });

  it('should not include subfolders when includeSubfolders=false', async () => {
    const child = createMockFolder({ id: 'c', name: 'Child', type: 'Actor' });
    const root = createMockFolder({ id: 'r', name: 'Root', type: 'Actor', children: [child] });
    setGame([root, child]);

    const result = await getFolderHandler({ folderId: 'r', includeSubfolders: false });

    expect(result.subfolders).toEqual([]);
  });

  it('should include contentIds when includeContents=true', async () => {
    const root = createMockFolder({
      id: 'r',
      name: 'Root',
      type: 'Actor',
      contents: [{ id: 'doc-1' }, { id: 'doc-2' }, { id: 'doc-3' }]
    });
    setGame([root]);

    const result = await getFolderHandler({ folderId: 'r', includeContents: true });

    expect(result.contentIds).toEqual(['doc-1', 'doc-2', 'doc-3']);
  });

  it('should not include contentIds by default', async () => {
    const root = createMockFolder({
      id: 'r',
      name: 'Root',
      type: 'Actor',
      contents: [{ id: 'doc-1' }]
    });
    setGame([root]);

    const result = await getFolderHandler({ folderId: 'r' });

    expect(result.contentIds).toBeUndefined();
  });

  it('should include contentIds for current folder only (not subfolders)', async () => {
    const child = createMockFolder({
      id: 'c',
      name: 'Child',
      type: 'Actor',
      contents: [{ id: 'child-doc' }]
    });
    const root = createMockFolder({
      id: 'r',
      name: 'Root',
      type: 'Actor',
      children: [child],
      contents: [{ id: 'root-doc' }]
    });
    setGame([root, child]);

    const result = await getFolderHandler({ folderId: 'r', includeContents: true });

    expect(result.contentIds).toEqual(['root-doc']);
    expect(result.subfolders[0]?.contentIds).toEqual(['child-doc']);
  });

  it('should map all summary fields on the requested folder', async () => {
    const root = createMockFolder({
      id: 'r',
      name: 'Heroes',
      type: 'Actor',
      color: '#00ff00',
      description: 'A description',
      sort: 50,
      parentId: 'parent'
    });
    setGame([root]);

    const result = await getFolderHandler({ folderId: 'r' });

    expect(result).toMatchObject({
      id: 'r',
      name: 'Heroes',
      type: 'Actor',
      color: '#00ff00',
      description: 'A description',
      parentId: 'parent',
      sort: 50
    });
  });

  it('should handle deeply nested 3-level tree', async () => {
    const level3 = createMockFolder({ id: 'l3', name: 'L3', type: 'Item' });
    const level2 = createMockFolder({ id: 'l2', name: 'L2', type: 'Item', children: [level3] });
    const level1 = createMockFolder({ id: 'l1', name: 'L1', type: 'Item', children: [level2] });
    const root = createMockFolder({ id: 'r', name: 'Root', type: 'Item', children: [level1] });
    setGame([root, level1, level2, level3]);

    const result = await getFolderHandler({ folderId: 'r' });

    expect(result.subfolders[0]?.id).toBe('l1');
    expect(result.subfolders[0]?.subfolders[0]?.id).toBe('l2');
    expect(result.subfolders[0]?.subfolders[0]?.subfolders[0]?.id).toBe('l3');
  });
});
