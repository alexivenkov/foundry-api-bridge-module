import { folderReferenceSchema } from '../FolderReferenceSchema';

describe('folderReferenceSchema (shared kernel)', () => {
  it('accepts an object with id only', () => {
    const result = folderReferenceSchema.safeParse({ id: 'folder-1' });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.id).toBe('folder-1');
  });

  it('accepts an object with name only', () => {
    const result = folderReferenceSchema.safeParse({ name: 'Loot' });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.name).toBe('Loot');
  });

  it('accepts both id and name', () => {
    const result = folderReferenceSchema.safeParse({ id: 'folder-1', name: 'Loot' });
    expect(result.success).toBe(true);
  });

  it('accepts recursive: true with id', () => {
    const result = folderReferenceSchema.safeParse({ id: 'folder-1', recursive: true });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.recursive).toBe(true);
  });

  it('trims whitespace from id', () => {
    const result = folderReferenceSchema.safeParse({ id: '  folder-1  ' });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.id).toBe('folder-1');
  });

  it('rejects an empty object', () => {
    const result = folderReferenceSchema.safeParse({});
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.message).toBe(
      "folder must specify at least 'id' or 'name'"
    );
  });

  it('rejects an empty string id (after trim)', () => {
    expect(folderReferenceSchema.safeParse({ id: '   ' }).success).toBe(false);
  });

  it('rejects an empty string name (after trim)', () => {
    expect(folderReferenceSchema.safeParse({ name: '   ' }).success).toBe(false);
  });

  it('rejects a non-string id', () => {
    expect(folderReferenceSchema.safeParse({ id: 123 }).success).toBe(false);
  });

  it('rejects a non-boolean recursive', () => {
    expect(
      folderReferenceSchema.safeParse({ id: 'folder-1', recursive: 'yes' }).success
    ).toBe(false);
  });
});
