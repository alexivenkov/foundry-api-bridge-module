import { folderReferenceSchema } from '../FolderReferenceSchema';

describe('folderReferenceSchema', () => {
  it('accepts an object with id only', () => {
    const result = folderReferenceSchema.safeParse({ id: 'folder-1' });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.id).toBe('folder-1');
  });

  it('accepts an object with name only', () => {
    const result = folderReferenceSchema.safeParse({ name: 'Monsters' });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.name).toBe('Monsters');
  });

  it('accepts both id and name', () => {
    const result = folderReferenceSchema.safeParse({ id: 'folder-1', name: 'Monsters' });
    expect(result.success).toBe(true);
  });

  it('accepts recursive: true with id', () => {
    const result = folderReferenceSchema.safeParse({ id: 'folder-1', recursive: true });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.recursive).toBe(true);
  });

  it('accepts recursive: false with name', () => {
    const result = folderReferenceSchema.safeParse({ name: 'Monsters', recursive: false });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.recursive).toBe(false);
  });

  it('trims whitespace from id', () => {
    const result = folderReferenceSchema.safeParse({ id: '  folder-1  ' });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.id).toBe('folder-1');
  });

  it('trims whitespace from name', () => {
    const result = folderReferenceSchema.safeParse({ name: '  Monsters  ' });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.name).toBe('Monsters');
  });

  it('rejects an empty object (must specify id or name)', () => {
    const result = folderReferenceSchema.safeParse({});
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.message).toBe(
      "folder must specify at least 'id' or 'name'"
    );
  });

  it('rejects an object with only recursive (no id, no name)', () => {
    const result = folderReferenceSchema.safeParse({ recursive: true });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.message).toBe(
      "folder must specify at least 'id' or 'name'"
    );
  });

  it('rejects an empty string id (after trim)', () => {
    const result = folderReferenceSchema.safeParse({ id: '   ' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty string name (after trim)', () => {
    const result = folderReferenceSchema.safeParse({ name: '   ' });
    expect(result.success).toBe(false);
  });

  it('rejects a non-boolean recursive', () => {
    const result = folderReferenceSchema.safeParse({ id: 'folder-1', recursive: 'yes' });
    expect(result.success).toBe(false);
  });

  it('rejects a non-string id', () => {
    expect(folderReferenceSchema.safeParse({ id: 123 }).success).toBe(false);
  });

  it('rejects a non-string name', () => {
    expect(folderReferenceSchema.safeParse({ name: 123 }).success).toBe(false);
  });
});
