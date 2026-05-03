import { createFolderHandler } from '../CreateFolderHandler';
import type { FoundryFolderDoc } from '../folderTypes';

const mockCreate = jest.fn();

function setFolderClass(): void {
  (globalThis as Record<string, unknown>)['Folder'] = {
    create: mockCreate
  };
}

function clearFolderClass(): void {
  delete (globalThis as Record<string, unknown>)['Folder'];
}

function makeReturnedFolder(overrides?: Partial<FoundryFolderDoc>): FoundryFolderDoc {
  return {
    id: 'created-1',
    name: 'New Folder',
    type: 'Actor',
    color: null,
    description: null,
    sort: 0,
    folder: null,
    contents: [],
    children: [],
    getSubfolders: jest.fn(() => []),
    update: jest.fn(),
    delete: jest.fn(),
    ...overrides
  };
}

describe('createFolderHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setFolderClass();
  });
  afterEach(clearFolderClass);

  it('should create folder with required fields only', async () => {
    mockCreate.mockResolvedValue(makeReturnedFolder({ id: 'new-1', name: 'Heroes', type: 'Actor' }));

    const result = await createFolderHandler({ name: 'Heroes', type: 'Actor' });

    expect(mockCreate).toHaveBeenCalledWith({ name: 'Heroes', type: 'Actor' });
    expect(result).toEqual({
      id: 'new-1',
      name: 'Heroes',
      type: 'Actor',
      color: null,
      description: null,
      parentId: null,
      sort: 0
    });
  });

  it('should pass parentId as folder when provided', async () => {
    mockCreate.mockResolvedValue(makeReturnedFolder({ folder: { id: 'parent-1' } }));

    await createFolderHandler({
      name: 'Sub',
      type: 'Actor',
      parentId: 'parent-1'
    });

    expect(mockCreate).toHaveBeenCalledWith({
      name: 'Sub',
      type: 'Actor',
      folder: 'parent-1'
    });
  });

  it('should pass color, description, sort when provided', async () => {
    mockCreate.mockResolvedValue(makeReturnedFolder());

    await createFolderHandler({
      name: 'Pretty',
      type: 'Item',
      color: '#abcdef',
      description: 'A nice folder',
      sort: 42
    });

    expect(mockCreate).toHaveBeenCalledWith({
      name: 'Pretty',
      type: 'Item',
      color: '#abcdef',
      description: 'A nice folder',
      sort: 42
    });
  });

  it('should pass all optional fields together', async () => {
    mockCreate.mockResolvedValue(makeReturnedFolder({
      id: 'full-1',
      name: 'Full',
      type: 'Scene',
      color: '#111111',
      description: 'Full description',
      sort: 99,
      folder: { id: 'parent-x' }
    }));

    const result = await createFolderHandler({
      name: 'Full',
      type: 'Scene',
      parentId: 'parent-x',
      color: '#111111',
      description: 'Full description',
      sort: 99
    });

    expect(mockCreate).toHaveBeenCalledWith({
      name: 'Full',
      type: 'Scene',
      folder: 'parent-x',
      color: '#111111',
      description: 'Full description',
      sort: 99
    });
    expect(result).toEqual({
      id: 'full-1',
      name: 'Full',
      type: 'Scene',
      color: '#111111',
      description: 'Full description',
      parentId: 'parent-x',
      sort: 99
    });
  });

  it('should not include optional fields when undefined', async () => {
    mockCreate.mockResolvedValue(makeReturnedFolder());

    await createFolderHandler({ name: 'Bare', type: 'Macro' });

    const call = mockCreate.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(call).not.toHaveProperty('folder');
    expect(call).not.toHaveProperty('color');
    expect(call).not.toHaveProperty('description');
    expect(call).not.toHaveProperty('sort');
  });

  it('should propagate error from Folder.create', async () => {
    mockCreate.mockRejectedValue(new Error('Foundry create failed'));

    await expect(createFolderHandler({ name: 'X', type: 'Actor' }))
      .rejects.toThrow('Foundry create failed');
  });
});
