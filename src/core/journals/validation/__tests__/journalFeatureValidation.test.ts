import {
  createJournalCategoryRequestSchema,
  createJournalPageRequestSchema,
  deleteJournalCategoryRequestSchema,
  panToNoteRequestSchema,
  searchJournalsRequestSchema,
  showImageRequestSchema,
  toCreateJournalCategoryCommand,
  toCreateJournalPageCommand,
  toPanToNoteCommand,
  toSearchJournalsQuery,
  toShowImageCommand,
  toUpdateJournalCategoryCommand,
  toUpdateJournalPageCommand,
  updateJournalCategoryRequestSchema,
  updateJournalPageRequestSchema
} from '..';
import { formatZodError } from '@/kernel';
import type { z } from 'zod';

function rejection(schema: z.ZodType, params: unknown): string {
  const parsed = schema.safeParse(params);
  if (parsed.success) {
    throw new Error(`expected ${JSON.stringify(params)} to be rejected`);
  }
  return formatZodError(parsed.error);
}

describe('page options of create-journal-page / update-journal-page', () => {
  const page = { journalId: 'j1', name: 'P' };

  it('accepts every option within the ranges of the schema', () => {
    const parsed = createJournalPageRequestSchema.parse({
      ...page,
      type: 'video',
      caption: null,
      title: { show: false, level: 6 },
      sort: -5,
      categoryId: null,
      video: { controls: false, loop: true, autoplay: true, volume: 0, timestamp: null, width: 1, height: null }
    });

    expect(parsed.video).toEqual({
      controls: false,
      loop: true,
      autoplay: true,
      volume: 0,
      timestamp: null,
      width: 1,
      height: null
    });
  });

  it.each([
    [{ title: { level: 0 } }, 'title.level'],
    [{ title: { level: 7 } }, 'title.level'],
    [{ title: { level: 1.5 } }, 'title.level'],
    [{ title: { show: 'yes' } }, 'title.show'],
    [{ video: { volume: 1.5 } }, 'video.volume'],
    [{ video: { timestamp: -1 } }, 'video.timestamp'],
    [{ video: { width: 0 } }, 'video.width'],
    [{ video: { height: 2.5 } }, 'video.height'],
    [{ sort: 1.5 }, 'sort'],
    [{ format: 'rich' }, 'format'],
    [{ caption: 5 }, 'caption'],
    [{ categoryId: '' }, 'categoryId'],
    [{ markdown: null }, 'markdown']
  ])('rejects %j at %s', (options, path) => {
    expect(rejection(createJournalPageRequestSchema, { ...page, ...options })).toMatch(new RegExp(`^${path}: `));
    expect(rejection(updateJournalPageRequestSchema, { journalId: 'j1', pageId: 'p1', ...options })).toMatch(
      new RegExp(`^${path}: `)
    );
  });

  it('keeps the text, the markdown source and the format consistent', () => {
    expect(rejection(createJournalPageRequestSchema, { ...page, markdown: '# T', format: 'html' })).toBe(
      "markdown: cannot be combined with format 'html'"
    );
    expect(rejection(createJournalPageRequestSchema, { ...page, format: 'markdown' })).toBe(
      "markdown: is required with format 'markdown'"
    );
    expect(rejection(updateJournalPageRequestSchema, { journalId: 'j1', pageId: 'p1', content: '<p>x</p>', markdown: '#' })).toBe(
      'content: cannot be combined with markdown: Foundry renders a markdown page from its markdown'
    );
    expect(createJournalPageRequestSchema.safeParse({ ...page, content: '<p>x</p>', format: 'html' }).success).toBe(true);
  });

  it('maps a markdown source to a markdown page on create and on update', () => {
    const created = toCreateJournalPageCommand(
      createJournalPageRequestSchema.parse({ ...page, markdown: '# T', sort: 3 })
    );
    expect(created.draft).toMatchObject({ type: 'text', format: 'markdown', markdown: '# T', sort: 3 });

    const updated = toUpdateJournalPageCommand(
      updateJournalPageRequestSchema.parse({ journalId: 'j1', pageId: 'p1', markdown: '# T', categoryId: 'c1' })
    );
    expect(updated.changes).toMatchObject({ format: 'markdown', markdown: '# T', categoryId: 'c1' });
  });
});

describe('journal category requests', () => {
  it('requires a journal, a non-blank name and an integer sort', () => {
    expect(rejection(createJournalCategoryRequestSchema, { journalId: 'j1', name: '  ' })).toMatch(/^name: /);
    expect(rejection(createJournalCategoryRequestSchema, { journalId: '', name: 'Lore' })).toMatch(/^journalId: /);
    expect(rejection(createJournalCategoryRequestSchema, { journalId: 'j1', name: 'Lore', sort: 0.5 })).toMatch(/^sort: /);
    expect(rejection(updateJournalCategoryRequestSchema, { journalId: 'j1', name: 'Lore' })).toMatch(/^categoryId: /);
    expect(rejection(deleteJournalCategoryRequestSchema, { journalId: 'j1', categoryId: 3 })).toMatch(/^categoryId: /);
  });

  it('maps to commands with the name trimmed', () => {
    expect(
      toCreateJournalCategoryCommand(createJournalCategoryRequestSchema.parse({ journalId: 'j1', name: ' Lore ', extra: 1 }))
    ).toEqual({ journalId: 'j1', draft: { name: 'Lore', sort: undefined } });
    expect(
      toUpdateJournalCategoryCommand(updateJournalCategoryRequestSchema.parse({ journalId: 'j1', categoryId: 'c1', sort: 7 }))
    ).toEqual({ journalId: 'j1', categoryId: 'c1', changes: { name: undefined, sort: 7 } });
  });
});

describe('show-image request', () => {
  it('needs a source; users are ids', () => {
    expect(rejection(showImageRequestSchema, { src: ' ' })).toMatch(/^src: /);
    expect(rejection(showImageRequestSchema, { src: 'a.png', users: ['u1', ''] })).toMatch(/^users\.1: /);
    expect(rejection(showImageRequestSchema, { src: 'a.png', title: 5 })).toMatch(/^title: /);
  });

  it('sends to everyone when no users are listed', () => {
    expect(toShowImageCommand(showImageRequestSchema.parse({ src: 'a.png' }))).toEqual({
      src: 'a.png',
      title: undefined,
      caption: undefined,
      users: []
    });
  });
});

describe('pan-to-note request', () => {
  it('takes a positive scale and a non-negative duration', () => {
    expect(rejection(panToNoteRequestSchema, { journalId: 'j1', scale: 0 })).toMatch(/^scale: /);
    expect(rejection(panToNoteRequestSchema, { journalId: 'j1', duration: -1 })).toMatch(/^duration: /);
    expect(toPanToNoteCommand(panToNoteRequestSchema.parse({ journalId: 'j1', scale: 2 }))).toEqual({
      journalId: 'j1',
      view: { scale: 2, duration: undefined }
    });
  });
});

describe('search-journals request', () => {
  it('needs a non-blank query and keeps limit and offset in range', () => {
    expect(rejection(searchJournalsRequestSchema, { query: '  ' })).toMatch(/^query: /);
    expect(rejection(searchJournalsRequestSchema, { query: 'x', limit: 0 })).toMatch(/^limit: /);
    expect(rejection(searchJournalsRequestSchema, { query: 'x', limit: 201 })).toMatch(/^limit: /);
    expect(rejection(searchJournalsRequestSchema, { query: 'x', offset: -1 })).toMatch(/^offset: /);
    expect(rejection(searchJournalsRequestSchema, { query: 'x', pageTypes: [''] })).toMatch(/^pageTypes\.0: /);
  });

  it('maps to a query', () => {
    expect(
      toSearchJournalsQuery(
        searchJournalsRequestSchema.parse({ query: ' goblin ', pageTypes: ['text'], searchContent: false, limit: 5, offset: 10 })
      )
    ).toEqual({ query: 'goblin', pageTypes: ['text'], searchContent: false, limit: 5, offset: 10 });
  });
});
