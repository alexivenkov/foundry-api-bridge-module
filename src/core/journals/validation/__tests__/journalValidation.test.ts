import {
  createJournalPageRequestSchema,
  createJournalRequestSchema,
  deleteJournalPageRequestSchema,
  deleteJournalRequestSchema,
  getJournalRequestSchema,
  getJournalsRequestSchema,
  showJournalRequestSchema,
  toCreateJournalCommand,
  toCreateJournalPageCommand,
  toDeleteJournalCommand,
  toDeleteJournalPageCommand,
  toGetJournalQuery,
  toListJournalsQuery,
  toShowJournalCommand,
  toUpdateJournalCommand,
  toUpdateJournalPageCommand,
  updateJournalPageRequestSchema,
  updateJournalRequestSchema
} from '..';

describe('journal request schemas', () => {
  it('accepts get-journals with or without the light flag, whatever its type', () => {
    expect(getJournalsRequestSchema.safeParse({}).success).toBe(true);
    expect(getJournalsRequestSchema.safeParse({ light: true }).success).toBe(true);
    expect(getJournalsRequestSchema.safeParse({ light: 'yes' }).success).toBe(true);
  });

  it('requires the journal id wherever a journal is addressed', () => {
    expect(getJournalRequestSchema.safeParse({}).success).toBe(false);
    expect(updateJournalRequestSchema.safeParse({ name: 'x' }).success).toBe(false);
    expect(deleteJournalRequestSchema.safeParse({}).success).toBe(false);
    expect(createJournalPageRequestSchema.safeParse({ name: 'Page' }).success).toBe(false);
    expect(showJournalRequestSchema.safeParse({ force: true }).success).toBe(false);
  });

  it('accepts an empty journal id, which then is simply not found', () => {
    expect(getJournalRequestSchema.safeParse({ journalId: '' }).success).toBe(true);
  });

  it('requires the page id for a page update and delete', () => {
    expect(updateJournalPageRequestSchema.safeParse({ journalId: 'j1' }).success).toBe(false);
    expect(deleteJournalPageRequestSchema.safeParse({ journalId: 'j1' }).success).toBe(false);
  });

  it('requires a name to create a journal or a page', () => {
    expect(createJournalRequestSchema.safeParse({}).success).toBe(false);
    expect(createJournalRequestSchema.safeParse({ name: 'Notes' }).success).toBe(true);
    expect(createJournalPageRequestSchema.safeParse({ journalId: 'j1' }).success).toBe(false);
  });

  it('lets null through where the old handlers handed the value to the core', () => {
    expect(createJournalRequestSchema.safeParse({ name: 'N', folder: null, content: null, pageType: null }).success)
      .toBe(true);
    expect(updateJournalRequestSchema.safeParse({ journalId: 'j1', name: null, folder: null }).success).toBe(true);
    expect(
      updateJournalPageRequestSchema.safeParse({ journalId: 'j1', pageId: 'p1', name: null, content: null, src: null })
        .success
    ).toBe(true);
  });

  it('accepts any string as a page type', () => {
    expect(createJournalRequestSchema.safeParse({ name: 'N', content: 'x', pageType: 'spell' }).success).toBe(true);
    expect(createJournalPageRequestSchema.safeParse({ journalId: 'j1', name: 'P', type: 'dnd5e.class' }).success)
      .toBe(true);
  });

  it('accepts an update that changes nothing', () => {
    expect(updateJournalRequestSchema.safeParse({ journalId: 'j1' }).success).toBe(true);
    expect(updateJournalPageRequestSchema.safeParse({ journalId: 'j1', pageId: 'p1' }).success).toBe(true);
  });

  it('does not look at the force flag or the user list of show-journal', () => {
    const request = { journalId: 'j1', force: 'yes', users: 'u1' };

    expect(showJournalRequestSchema.parse(request)).toEqual(request);
  });

  it('rejects a page id that is not a string', () => {
    expect(showJournalRequestSchema.safeParse({ journalId: 'j1', pageId: null }).success).toBe(false);
  });

  it('ignores unknown keys', () => {
    expect(deleteJournalRequestSchema.parse({ journalId: 'j1', cascade: true })).toEqual({ journalId: 'j1' });
  });
});

describe('journal request mappers', () => {
  it.each([
    [true, true],
    [false, false],
    [undefined, false],
    [1, false],
    ['true', false]
  ])('reads light %p as %s', (light, expected) => {
    expect(toListJournalsQuery({ light })).toEqual({ light: expected });
  });

  it('maps a get request', () => {
    expect(toGetJournalQuery({ journalId: 'j1' })).toEqual({ journalId: 'j1' });
  });

  describe('create-journal', () => {
    it('drafts a journal without pages when no content is given', () => {
      expect(toCreateJournalCommand({ name: 'Notes', pageType: 'image' })).toEqual({
        draft: { name: 'Notes', folderId: undefined, firstPage: undefined }
      });
    });

    it('drafts a first text page named after the journal', () => {
      expect(toCreateJournalCommand({ name: 'Session Notes', folder: 'f1', content: '<p>Today…</p>' })).toEqual({
        draft: {
          name: 'Session Notes',
          folderId: 'f1',
          firstPage: { name: 'Session Notes', type: 'text', text: '<p>Today…</p>', src: undefined }
        }
      });
    });

    it('drafts a first page of another type without the content', () => {
      const { draft } = toCreateJournalCommand({ name: 'Map', content: 'ignored-for-image', pageType: 'image' });

      expect(draft.firstPage).toEqual({ name: 'Map', type: 'image', text: undefined, src: undefined });
    });

    it('reads a null page type as text and keeps a null content and folder', () => {
      const { draft } = toCreateJournalCommand({ name: 'N', folder: null, content: null, pageType: null });

      expect(draft.folderId).toBeNull();
      expect(draft.firstPage).toMatchObject({ type: 'text', text: null });
    });

    it('keeps an empty page type as given', () => {
      expect(toCreateJournalCommand({ name: 'N', content: 'x', pageType: '' }).draft.firstPage).toMatchObject({
        type: '',
        text: undefined
      });
    });
  });

  it('maps a journal update, the folder becoming folderId', () => {
    expect(toUpdateJournalCommand({ journalId: 'j1', folder: null })).toEqual({
      journalId: 'j1',
      changes: { name: undefined, folderId: null }
    });
  });

  it('maps a journal delete', () => {
    expect(toDeleteJournalCommand({ journalId: 'j1' })).toEqual({ journalId: 'j1' });
  });

  describe('create-journal-page', () => {
    it('drafts a text page with its content', () => {
      expect(toCreateJournalPageCommand({ journalId: 'j1', name: 'New Page', content: '<p>Body</p>' })).toEqual({
        journalId: 'j1',
        draft: { name: 'New Page', type: 'text', text: '<p>Body</p>', src: undefined }
      });
    });

    it('drafts a file page with its source and without the content', () => {
      const command = toCreateJournalPageCommand({
        journalId: 'j1',
        name: 'Rules',
        type: 'pdf',
        content: 'ignored',
        src: 'docs/rules.pdf'
      });

      expect(command.draft).toEqual({ name: 'Rules', type: 'pdf', text: undefined, src: 'docs/rules.pdf' });
    });

    it('reads a null type as text', () => {
      expect(toCreateJournalPageCommand({ journalId: 'j1', name: 'P', type: null }).draft.type).toBe('text');
    });
  });

  it('maps a page update, the content becoming the text', () => {
    expect(toUpdateJournalPageCommand({ journalId: 'j1', pageId: 'p1', content: '<p>New</p>' })).toEqual({
      journalId: 'j1',
      pageId: 'p1',
      changes: { name: undefined, text: '<p>New</p>', src: undefined }
    });
  });

  it('maps a page delete', () => {
    expect(toDeleteJournalPageCommand({ journalId: 'j1', pageId: 'p1' })).toEqual({ journalId: 'j1', pageId: 'p1' });
  });

  describe('show-journal', () => {
    it.each([
      [true, true],
      [1, true],
      ['yes', true],
      [false, false],
      [0, false],
      [undefined, false]
    ])('reads force %p as %s', (force, expected) => {
      expect(toShowJournalCommand({ journalId: 'j1', force }).audience.force).toBe(expected);
    });

    it('hands the user list over as given', () => {
      const users = ['u1', 'u2'];

      const command = toShowJournalCommand({ journalId: 'j1', pageId: 'p1', users });

      expect(command).toEqual({ journalId: 'j1', pageId: 'p1', audience: { force: false, users } });
      expect(command.audience.users).toBe(users);
    });

    it('leaves the audience open when no users are named', () => {
      expect(toShowJournalCommand({ journalId: 'j1' }).audience.users).toBeUndefined();
    });
  });
});
