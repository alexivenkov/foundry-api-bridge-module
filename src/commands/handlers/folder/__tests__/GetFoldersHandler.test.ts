import { getFoldersHandler } from '../GetFoldersHandler';
import type { FoundryFolderDoc } from '../folderTypes';

interface MockFolderInput {
  id: string;
  name: string;
  type: string;
  color?: string | null;
  description?: string | null;
  sort?: number;
  parentId?: string | null;
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

describe('getFoldersHandler', () => {
  afterEach(clearGame);

  it('should return all folders when no type filter', async () => {
    setGame([
      createMockFolder({ id: 'f1', name: 'Heroes', type: 'Actor' }),
      createMockFolder({ id: 'f2', name: 'Loot', type: 'Item' }),
      createMockFolder({ id: 'f3', name: 'Maps', type: 'Scene' })
    ]);

    const result = await getFoldersHandler({});

    expect(result).toHaveLength(3);
    expect(result.map(f => f.id)).toEqual(['f1', 'f2', 'f3']);
  });

  it('should filter folders by type', async () => {
    setGame([
      createMockFolder({ id: 'f1', name: 'Heroes', type: 'Actor' }),
      createMockFolder({ id: 'f2', name: 'NPCs', type: 'Actor' }),
      createMockFolder({ id: 'f3', name: 'Loot', type: 'Item' })
    ]);

    const result = await getFoldersHandler({ type: 'Actor' });

    expect(result).toHaveLength(2);
    expect(result.map(f => f.id)).toEqual(['f1', 'f2']);
    expect(result.every(f => f.type === 'Actor')).toBe(true);
  });

  it('should return empty array for empty collection', async () => {
    setGame([]);

    const result = await getFoldersHandler({});

    expect(result).toEqual([]);
  });

  it('should return empty array when type filter matches nothing', async () => {
    setGame([
      createMockFolder({ id: 'f1', name: 'Heroes', type: 'Actor' })
    ]);

    const result = await getFoldersHandler({ type: 'Macro' });

    expect(result).toEqual([]);
  });

  it('should map all summary fields correctly', async () => {
    setGame([
      createMockFolder({
        id: 'f1',
        name: 'Heroes',
        type: 'Actor',
        color: '#ff0000',
        description: 'Player heroes',
        sort: 100,
        parentId: 'parent-folder'
      })
    ]);

    const result = await getFoldersHandler({});

    expect(result[0]).toEqual({
      id: 'f1',
      name: 'Heroes',
      type: 'Actor',
      color: '#ff0000',
      description: 'Player heroes',
      parentId: 'parent-folder',
      sort: 100
    });
  });

  it('should map null color and description for root-level folders', async () => {
    setGame([
      createMockFolder({ id: 'f1', name: 'Top', type: 'Item' })
    ]);

    const result = await getFoldersHandler({});

    expect(result[0]?.color).toBeNull();
    expect(result[0]?.description).toBeNull();
    expect(result[0]?.parentId).toBeNull();
  });

  it('should handle multiple document types in mixed collection', async () => {
    setGame([
      createMockFolder({ id: 'f1', type: 'Actor', name: 'A' }),
      createMockFolder({ id: 'f2', type: 'Item', name: 'B' }),
      createMockFolder({ id: 'f3', type: 'Scene', name: 'C' }),
      createMockFolder({ id: 'f4', type: 'JournalEntry', name: 'D' }),
      createMockFolder({ id: 'f5', type: 'RollTable', name: 'E' }),
      createMockFolder({ id: 'f6', type: 'Macro', name: 'F' }),
      createMockFolder({ id: 'f7', type: 'Cards', name: 'G' }),
      createMockFolder({ id: 'f8', type: 'Playlist', name: 'H' }),
      createMockFolder({ id: 'f9', type: 'Compendium', name: 'I' })
    ]);

    const result = await getFoldersHandler({});

    expect(result).toHaveLength(9);
    const types = new Set(result.map(f => f.type));
    expect(types.size).toBe(9);
  });
});
