import {
  createFolderRequestSchema,
  deleteFolderRequestSchema,
  getFolderRequestSchema,
  getFoldersRequestSchema,
  toCreateFolderCommand,
  toDeleteFolderCommand,
  toGetFolderQuery,
  toListFoldersQuery,
  toUpdateFolderCommand,
  updateFolderRequestSchema
} from '..';

describe('folder request schemas', () => {
  it('leaves the type filter optional and takes any document type name', () => {
    expect(getFoldersRequestSchema.safeParse({}).success).toBe(true);
    expect(getFoldersRequestSchema.safeParse({ type: 'Adventure' }).success).toBe(true);
    expect(getFoldersRequestSchema.safeParse({ type: 5 }).success).toBe(false);
  });

  it('accepts a folder with only its name and type', () => {
    expect(createFolderRequestSchema.safeParse({ name: 'Heroes', type: 'Actor' }).success).toBe(true);
  });

  it.each([
    ['no name', { type: 'Actor' }],
    ['no type', { name: 'Heroes' }],
    ['a non-numeric sort', { name: 'Heroes', type: 'Actor', sort: 'first' }],
    ['a non-string color', { name: 'Heroes', type: 'Actor', color: 0xff0000 }]
  ])('rejects a new folder with %s', (_case, request) => {
    expect(createFolderRequestSchema.safeParse(request).success).toBe(false);
  });

  it('accepts null where it moves the folder to the root or clears its color or description', () => {
    const cleared = { parentId: null, color: null, description: null };

    expect(updateFolderRequestSchema.safeParse({ folderId: 'f1', ...cleared }).success).toBe(true);
    expect(createFolderRequestSchema.safeParse({ name: 'Heroes', type: 'Actor', ...cleared }).success).toBe(true);
  });

  it('does not take null for the name or the sort order', () => {
    expect(updateFolderRequestSchema.safeParse({ folderId: 'f1', name: null }).success).toBe(false);
    expect(updateFolderRequestSchema.safeParse({ folderId: 'f1', sort: null }).success).toBe(false);
  });

  it('requires the folder id wherever a folder is addressed', () => {
    expect(getFolderRequestSchema.safeParse({}).success).toBe(false);
    expect(updateFolderRequestSchema.safeParse({ name: 'x' }).success).toBe(false);
    expect(deleteFolderRequestSchema.safeParse({ deleteContents: true }).success).toBe(false);
  });

  it('accepts an update that changes nothing', () => {
    expect(updateFolderRequestSchema.parse({ folderId: 'f1' })).toEqual({ folderId: 'f1' });
  });

  it('ignores a tree flag that is not a boolean instead of rejecting the request', () => {
    const parsed = getFolderRequestSchema.parse({ folderId: 'f1', includeSubfolders: 'no', includeContents: 'true' });

    expect(parsed).toEqual({ folderId: 'f1' });
  });

  it('rejects a deletion choice that is not a boolean', () => {
    expect(deleteFolderRequestSchema.safeParse({ folderId: 'f1', deleteSubfolders: 'yes' }).success).toBe(false);
  });

  it('ignores unknown keys', () => {
    expect(createFolderRequestSchema.parse({ name: 'Heroes', type: 'Actor', sorting: 'm' }))
      .toEqual({ name: 'Heroes', type: 'Actor' });
  });
});

describe('folder request mappers', () => {
  it('maps the type filter', () => {
    expect(toListFoldersQuery({})).toEqual({ type: undefined });
    expect(toListFoldersQuery({ type: 'Item' })).toEqual({ type: 'Item' });
  });

  it('includes subfolders unless they are refused and contents only when asked', () => {
    expect(toGetFolderQuery({ folderId: 'f1' })).toEqual({
      folderId: 'f1',
      tree: { includeSubfolders: true, includeContents: false }
    });
    expect(toGetFolderQuery({ folderId: 'f1', includeSubfolders: false, includeContents: true }).tree)
      .toEqual({ includeSubfolders: false, includeContents: true });
    expect(toGetFolderQuery({ folderId: 'f1', includeSubfolders: true, includeContents: false }).tree)
      .toEqual({ includeSubfolders: true, includeContents: false });
  });

  it('builds a draft from a create request', () => {
    const command = toCreateFolderCommand({
      name: 'Maps',
      type: 'Scene',
      parentId: 'atlas',
      color: '#abcdef',
      description: 'Battle maps',
      sort: 42
    });

    expect(command.draft).toEqual({
      name: 'Maps',
      type: 'Scene',
      parentId: 'atlas',
      color: '#abcdef',
      description: 'Battle maps',
      sort: 42
    });
  });

  it('keeps an update partial and preserves an explicit null', () => {
    const command = toUpdateFolderCommand({ folderId: 'f1', parentId: null, color: null });

    expect(command.folderId).toBe('f1');
    expect(command.changes.parentId).toBeNull();
    expect(command.changes.color).toBeNull();
    expect(command.changes.description).toBeUndefined();
    expect(command.changes.name).toBeUndefined();
    expect(command.changes.sort).toBeUndefined();
  });

  it('tells an omitted parent from the root', () => {
    expect(toUpdateFolderCommand({ folderId: 'f1', name: 'Renamed' }).changes.parentId).toBeUndefined();
  });

  it('carries the deletion choices as given', () => {
    expect(toDeleteFolderCommand({ folderId: 'f1' })).toEqual({
      folderId: 'f1',
      options: { deleteSubfolders: undefined, deleteContents: undefined }
    });
    expect(toDeleteFolderCommand({ folderId: 'f1', deleteSubfolders: true, deleteContents: false }).options)
      .toEqual({ deleteSubfolders: true, deleteContents: false });
  });
});
