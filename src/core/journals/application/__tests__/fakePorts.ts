import type {
  JournalAudience,
  JournalChanges,
  JournalContent,
  JournalDraft,
  JournalIdentity,
  JournalPageChanges,
  JournalPageContent,
  JournalPageDraft,
  JournalPageSummary,
  JournalPresenter,
  JournalShowTarget,
  JournalStore,
  JournalSummary,
  TextEnricher
} from '../../domain';

export function page(overrides: Partial<JournalPageContent> = {}): JournalPageContent {
  return {
    id: 'p1',
    name: 'Page One',
    type: 'text',
    text: '<p>Hello</p>',
    markdown: null,
    src: null,
    ...overrides
  };
}

export function journal(overrides: Partial<JournalContent> = {}): JournalContent {
  return {
    id: 'j1',
    uuid: 'JournalEntry.j1',
    name: 'Quest Log',
    folderName: 'Adventures',
    pages: [page()],
    ...overrides
  };
}

function summarize(content: JournalContent): JournalSummary {
  return {
    id: content.id,
    name: content.name,
    folderId: null,
    pages: content.pages.map(({ id, name, type }) => ({ id, name, type }))
  };
}

export class FakeJournalStore implements JournalStore {
  readonly created: JournalDraft[] = [];
  readonly updated: Array<{ journalId: string; changes: JournalChanges }> = [];
  readonly deleted: string[] = [];
  readonly createdPages: Array<{ journalId: string; draft: JournalPageDraft }> = [];
  readonly updatedPages: Array<{ journalId: string; pageId: string; changes: JournalPageChanges }> = [];
  readonly deletedPages: Array<{ journalId: string; pageId: string }> = [];
  createsNothing = false;
  losesDocumentOnUpdate = false;

  constructor(private readonly journals: readonly JournalContent[] = []) {}

  listJournals(): readonly JournalContent[] {
    return this.journals;
  }

  findJournalContent(journalId: string): JournalContent | null {
    return this.journals.find((candidate) => candidate.id === journalId) ?? null;
  }

  findJournal(journalId: string): JournalIdentity | null {
    const found = this.findJournalContent(journalId);
    return found !== null ? { id: found.id, name: found.name } : null;
  }

  findPage(journalId: string, pageId: string): JournalPageSummary | null {
    const found = this.findJournalContent(journalId)?.pages.find((candidate) => candidate.id === pageId);
    return found !== undefined ? { id: found.id, name: found.name, type: found.type } : null;
  }

  createJournal(draft: JournalDraft): Promise<JournalSummary | null> {
    this.created.push(draft);
    return Promise.resolve(
      this.createsNothing ? null : { id: 'created', name: draft.name, folderId: draft.folderId ?? null, pages: [] }
    );
  }

  updateJournal(journalId: string, changes: JournalChanges): Promise<JournalSummary | null> {
    this.updated.push({ journalId, changes });
    const found = this.findJournalContent(journalId);
    if (found === null || this.losesDocumentOnUpdate) {
      return Promise.resolve(null);
    }
    return Promise.resolve({ ...summarize(found), name: changes.name ?? found.name });
  }

  deleteJournal(journalId: string): Promise<void> {
    this.deleted.push(journalId);
    return Promise.resolve();
  }

  createPage(journalId: string, draft: JournalPageDraft): Promise<JournalPageSummary | null> {
    this.createdPages.push({ journalId, draft });
    return Promise.resolve(this.createsNothing ? null : { id: 'created-page', name: draft.name, type: draft.type });
  }

  updatePage(journalId: string, pageId: string, changes: JournalPageChanges): Promise<JournalPageSummary | null> {
    this.updatedPages.push({ journalId, pageId, changes });
    const found = this.findPage(journalId, pageId);
    if (found === null || this.losesDocumentOnUpdate) {
      return Promise.resolve(null);
    }
    return Promise.resolve({ ...found, name: changes.name ?? found.name });
  }

  deletePage(journalId: string, pageId: string): Promise<void> {
    this.deletedPages.push({ journalId, pageId });
    return Promise.resolve();
  }
}

export class FakeJournalPresenter implements JournalPresenter {
  readonly shown: Array<{ target: JournalShowTarget; audience: JournalAudience }> = [];
  losesTarget = false;

  show(target: JournalShowTarget, audience: JournalAudience): Promise<boolean> {
    this.shown.push({ target, audience });
    return Promise.resolve(!this.losesTarget);
  }
}

export class FakeTextEnricher implements TextEnricher {
  readonly enriched: string[] = [];
  available = true;
  /** Texts whose enrichment fails. */
  failsOn: readonly string[] = [];

  enrich(html: string): Promise<string | null> {
    this.enriched.push(html);
    if (this.failsOn.includes(html)) {
      return Promise.reject(new Error('Enrichment failed'));
    }
    return Promise.resolve(this.available ? `<enriched>${html}</enriched>` : null);
  }
}
