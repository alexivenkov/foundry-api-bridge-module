import type {
  JournalAudience,
  JournalChanges,
  JournalContent,
  JournalDraft,
  JournalIdentity,
  JournalPageChanges,
  JournalPageDraft,
  JournalPageSummary,
  JournalPresenter,
  JournalShowTarget,
  JournalStore,
  JournalSummary
} from '@/core/journals/domain';
import { foundryGeneration } from '@/compat/foundryVersion';
import { JOURNAL_CATEGORIES_SINCE_GENERATION } from '@/core/journals/domain';
import { resolveJournalClass } from './foundryJournalClasses';
import type { FoundryJournalEntry, JournalGlobalsProvider } from './foundryJournalTypes';
import {
  toCategoryIndex,
  toFoundryJournalData,
  toFoundryJournalUpdate,
  toFoundryPageData,
  toFoundryPageUpdate,
  toFoundryShowOptions,
  toJournalContent,
  toJournalIdentity,
  toJournalSummary,
  toPageDetail,
  toPageSummary,
  type CategoryIndex
} from './journalMapper';

const PAGE_DOCUMENT = 'JournalEntryPage';

/** Anti-corruption layer over the world's JournalEntry documents and their embedded pages. */
export class FoundryJournalStore implements JournalStore, JournalPresenter {
  constructor(
    private readonly globals: JournalGlobalsProvider,
    private readonly generation: () => number = foundryGeneration
  ) {}

  listJournals(): readonly JournalContent[] {
    const journals: JournalContent[] = [];
    this.globals().game.journal?.forEach((entry) => {
      journals.push(toJournalContent(entry, this.categoryIndex(entry)));
    });
    return journals;
  }

  findJournalContent(journalId: string): JournalContent | null {
    const entry = this.findEntry(journalId);
    return entry !== undefined ? toJournalContent(entry, this.categoryIndex(entry)) : null;
  }

  findJournal(journalId: string): JournalIdentity | null {
    const entry = this.findEntry(journalId);
    return entry !== undefined ? toJournalIdentity(entry) : null;
  }

  findPage(journalId: string, pageId: string): JournalPageSummary | null {
    const page = this.findEntry(journalId)?.pages.get(pageId);
    return page !== undefined ? toPageSummary(page) : null;
  }

  async createJournal(draft: JournalDraft): Promise<JournalSummary | null> {
    const created = await this.globals().JournalEntry.create(toFoundryJournalData(draft));
    return created ? toJournalSummary(created) : null;
  }

  async updateJournal(journalId: string, changes: JournalChanges): Promise<JournalSummary | null> {
    const entry = this.findEntry(journalId);
    if (entry === undefined) {
      return null;
    }
    await entry.update(toFoundryJournalUpdate(changes));
    return toJournalSummary(entry);
  }

  async deleteJournal(journalId: string): Promise<void> {
    await this.findEntry(journalId)?.delete();
  }

  async createPage(journalId: string, draft: JournalPageDraft): Promise<JournalPageSummary | null> {
    const entry = this.findEntry(journalId);
    const created = await entry?.createEmbeddedDocuments(PAGE_DOCUMENT, [toFoundryPageData(draft)]);
    const page = created?.[0];
    return page && entry ? toPageDetail(page, this.categoryIndex(entry)) : null;
  }

  async updatePage(journalId: string, pageId: string, changes: JournalPageChanges): Promise<JournalPageSummary | null> {
    const entry = this.findEntry(journalId);
    const page = entry?.pages.get(pageId);
    if (entry === undefined || page === undefined) {
      return null;
    }
    await page.update(toFoundryPageUpdate(changes));
    return toPageDetail(page, this.categoryIndex(entry));
  }

  async deletePage(journalId: string, pageId: string): Promise<void> {
    await this.findEntry(journalId)?.deleteEmbeddedDocuments(PAGE_DOCUMENT, [pageId]);
  }

  async show(target: JournalShowTarget, audience: JournalAudience): Promise<boolean> {
    const entry = this.findEntry(target.journalId);
    const document = target.pageId === undefined ? entry : entry?.pages.get(target.pageId);
    if (document === undefined) {
      return false;
    }
    await resolveJournalClass(this.globals()).show(document, toFoundryShowOptions(audience));
    return true;
  }

  private findEntry(journalId: string): FoundryJournalEntry | undefined {
    return this.globals().game.journal?.get(journalId);
  }

  private categoryIndex(entry: FoundryJournalEntry): CategoryIndex {
    if (this.generation() < JOURNAL_CATEGORIES_SINCE_GENERATION || entry.categories === undefined) {
      return undefined;
    }
    return toCategoryIndex(entry.categories);
  }
}
