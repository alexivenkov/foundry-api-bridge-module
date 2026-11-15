import {
  createNoteRequestSchema,
  deleteNoteRequestSchema,
  getNotesRequestSchema,
  toCreateNoteCommand,
  toDeleteNoteCommand,
  toListNotesQuery,
  toUpdateNoteCommand,
  updateNoteRequestSchema
} from '..';

describe('note request schemas', () => {
  it('accepts a note with only its position', () => {
    expect(createNoteRequestSchema.safeParse({ x: 1, y: 2 }).success).toBe(true);
  });

  it.each([
    ['no position', {}],
    ['a non-numeric coordinate', { x: '1', y: 2 }],
    ['a non-boolean global flag', { x: 1, y: 2, global: 'yes' }]
  ])('rejects a new note with %s', (_case, request) => {
    expect(createNoteRequestSchema.safeParse(request).success).toBe(false);
  });

  it('ignores a text anchor outside its enum instead of rejecting the request', () => {
    expect(createNoteRequestSchema.parse({ x: 1, y: 2, textAnchor: 'middle' })).toEqual({ x: 1, y: 2 });
    expect(updateNoteRequestSchema.parse({ noteId: 'n1', textAnchor: '' })).toEqual({ noteId: 'n1' });
  });

  it('accepts null where it clears a link, the label or a color', () => {
    const request = { noteId: 'n1', entryId: null, pageId: null, text: null, iconTint: null, textColor: null };

    expect(updateNoteRequestSchema.safeParse(request).success).toBe(true);
  });

  it('requires the note id for update and delete', () => {
    expect(updateNoteRequestSchema.safeParse({ text: 'x' }).success).toBe(false);
    expect(deleteNoteRequestSchema.safeParse({}).success).toBe(false);
  });

  it('ignores unknown keys and leaves the scene optional', () => {
    expect(createNoteRequestSchema.parse({ x: 1, y: 2, color: 'red' })).toEqual({ x: 1, y: 2 });
    expect(getNotesRequestSchema.safeParse({}).success).toBe(true);
  });
});

describe('note request mappers', () => {
  it('builds a draft from a create request', () => {
    const command = toCreateNoteCommand({ sceneId: 's1', x: 1, y: 2, text: 'Pin', textAnchor: 'top' });

    expect(command.sceneId).toBe('s1');
    expect(command.draft).toMatchObject({ x: 1, y: 2, text: 'Pin', textAnchor: 'top' });
    expect(command.draft.iconSrc).toBeUndefined();
  });

  it('keeps an update partial and preserves an explicit null', () => {
    const command = toUpdateNoteCommand({ noteId: 'n1', entryId: null });

    expect(command.noteId).toBe('n1');
    expect(command.changes.entryId).toBeNull();
    expect(command.changes.x).toBeUndefined();
    expect(command.changes.text).toBeUndefined();
  });

  it('maps list and delete requests', () => {
    expect(toListNotesQuery({})).toEqual({ sceneId: undefined });
    expect(toDeleteNoteCommand({ sceneId: 's1', noteId: 'n1' })).toEqual({ sceneId: 's1', noteId: 'n1' });
  });
});
