import { draftJournalPage, toPageIndexEntry, type JournalPageContent } from '..';

describe('draftJournalPage', () => {
  it('drafts a text page when no type is named', () => {
    expect(draftJournalPage({ name: 'Notes', content: '<p>Hello</p>' })).toEqual({
      name: 'Notes',
      type: 'text',
      text: '<p>Hello</p>',
      src: undefined
    });
  });

  it('drafts a text page without content', () => {
    const draft = draftJournalPage({ name: 'Blank' });

    expect(draft.type).toBe('text');
    expect(draft.text).toBeUndefined();
  });

  it('keeps a null content on a text page for the core to judge', () => {
    expect(draftJournalPage({ name: 'Notes', type: 'text', content: null }).text).toBeNull();
  });

  it.each(['image', 'video', 'pdf', 'spell', ''])('gives a page of type %j no text content', (type) => {
    const draft = draftJournalPage({ name: 'Map', type, content: 'ignored' });

    expect(draft.type).toBe(type);
    expect(draft.text).toBeUndefined();
  });

  it('carries the source file on a page of any type', () => {
    expect(draftJournalPage({ name: 'Map', type: 'image', src: 'maps/town.png' }).src).toBe('maps/town.png');
    expect(draftJournalPage({ name: 'Notes', src: 'notes.md' })).toMatchObject({ type: 'text', src: 'notes.md' });
  });
});

describe('toPageIndexEntry', () => {
  it('keeps what a page is and which file it shows, and drops its text', () => {
    const page: JournalPageContent = {
      id: 'p1',
      name: 'Map',
      type: 'image',
      text: '<p>Legend</p>',
      markdown: '# Legend',
      src: 'maps/town.png'
    };

    expect(toPageIndexEntry(page)).toEqual({
      id: 'p1',
      name: 'Map',
      type: 'image',
      text: null,
      markdown: null,
      enrichedText: null,
      src: 'maps/town.png'
    });
  });
});
