import { parseRequest } from '../../../shared';
import { createNoteRequestSchema, toCreateNoteCommand, toUpdateNoteCommand, updateNoteRequestSchema } from '..';

describe('note detail validation', () => {
  it('expands a short icon tint and text color, which the core would misread', () => {
    const command = toCreateNoteCommand(parseRequest(createNoteRequestSchema, { x: 0, y: 0, iconTint: '#f80', textColor: '#0Af' }));
    expect(command.draft).toMatchObject({ iconTint: '#ff8800', textColor: '#00AAff' });
  });

  it('passes full colors and null unchanged', () => {
    const command = toUpdateNoteCommand(parseRequest(updateNoteRequestSchema, { noteId: 'n', iconTint: '#ff0000', textColor: null }));
    expect(command.changes).toMatchObject({ iconTint: '#ff0000', textColor: null });
  });

  it('maps the note details and reads an empty font as the default one', () => {
    const command = toUpdateNoteCommand(
      parseRequest(updateNoteRequestSchema, { noteId: 'n', elevation: 2.5, sort: 4, fontFamily: '', locked: true, levels: ['ground'] })
    );
    expect(command.changes).toMatchObject({ elevation: 2.5, sort: 4, fontFamily: null, locked: true, levels: ['ground'] });
  });

  it.each([
    ['a fractional sort', { sort: 2.5 }],
    ['a non-boolean lock', { locked: 'yes' }],
    ['an empty level id', { levels: [''] }]
  ])('rejects %s', (_label, fields) => {
    expect(() => parseRequest(updateNoteRequestSchema, { noteId: 'n', ...fields })).toThrow();
  });
});
