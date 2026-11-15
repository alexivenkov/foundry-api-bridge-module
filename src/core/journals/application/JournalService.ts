import {
  JournalCreationCancelledError,
  JournalNotFoundError,
  JournalPageCreationFailedError,
  JournalPageNotFoundError,
  toPageIndexEntry,
  type JournalCategoryStore,
  type JournalContent,
  type JournalIdentity,
  type JournalPageContent,
  type JournalPageSummary,
  type JournalPageView,
  type JournalPresenter,
  type JournalStore,
  type JournalSummary,
  type JournalView,
  type TextEnricher
} from '@/core/journals/domain';
import type {
  CreateJournalCommand,
  CreateJournalPageCommand,
  DeleteJournalCommand,
  DeleteJournalPageCommand,
  GetJournalQuery,
  ListJournalsQuery,
  ShowJournalCommand,
  UpdateJournalCommand,
  UpdateJournalPageCommand
} from './commands';
import { requireCategory, requireCategoryFeature } from './categoryAccess';

export interface JournalServiceDependencies {
  readonly journals: JournalStore;
  readonly presenter: JournalPresenter;
  readonly enricher: TextEnricher;
  /** Needed only to file pages in categories; without it a category is refused as unavailable. */
  readonly categories?: JournalCategoryStore | undefined;
}

export interface JournalShownResult {
  readonly journal: JournalIdentity;
  readonly pageId: string | undefined;
}

export class JournalService {
  constructor(private readonly deps: JournalServiceDependencies) {}

  async listJournals(query: ListJournalsQuery): Promise<readonly JournalView[]> {
    return Promise.all(this.deps.journals.listJournals().map((journal) => this.read(journal, query.light)));
  }

  async getJournal(query: GetJournalQuery): Promise<JournalView> {
    const journal = this.deps.journals.findJournalContent(query.journalId);
    if (journal === null) {
      throw new JournalNotFoundError(query.journalId);
    }
    return this.read(journal, false);
  }

  async createJournal(command: CreateJournalCommand): Promise<JournalSummary> {
    const journal = await this.deps.journals.createJournal(command.draft);
    if (journal === null) {
      throw new JournalCreationCancelledError();
    }
    return journal;
  }

  async updateJournal(command: UpdateJournalCommand): Promise<JournalSummary> {
    this.requireJournal(command.journalId);
    const updated = await this.deps.journals.updateJournal(command.journalId, command.changes);
    if (updated === null) {
      throw new JournalNotFoundError(command.journalId);
    }
    return updated;
  }

  async deleteJournal(command: DeleteJournalCommand): Promise<void> {
    this.requireJournal(command.journalId);
    await this.deps.journals.deleteJournal(command.journalId);
  }

  async createPage(command: CreateJournalPageCommand): Promise<JournalPageSummary> {
    this.requireJournal(command.journalId);
    this.requirePageCategory(command.journalId, command.draft.categoryId);
    const page = await this.deps.journals.createPage(command.journalId, command.draft);
    if (page === null) {
      throw new JournalPageCreationFailedError();
    }
    return page;
  }

  async updatePage(command: UpdateJournalPageCommand): Promise<JournalPageSummary> {
    this.requireJournal(command.journalId);
    this.requirePage(command.journalId, command.pageId);
    this.requirePageCategory(command.journalId, command.changes.categoryId);
    const updated = await this.deps.journals.updatePage(command.journalId, command.pageId, command.changes);
    if (updated === null) {
      throw new JournalPageNotFoundError(command.pageId);
    }
    return updated;
  }

  async deletePage(command: DeleteJournalPageCommand): Promise<void> {
    this.requireJournal(command.journalId);
    this.requirePage(command.journalId, command.pageId);
    await this.deps.journals.deletePage(command.journalId, command.pageId);
  }

  /** Shows the journal, or one page of it, to the players. */
  async showJournal(command: ShowJournalCommand): Promise<JournalShownResult> {
    const journal = this.requireJournal(command.journalId);
    if (command.pageId !== undefined) {
      this.requirePage(command.journalId, command.pageId);
    }

    const shown = await this.deps.presenter.show(
      { journalId: command.journalId, pageId: command.pageId },
      command.audience
    );
    if (!shown) {
      throw new JournalNotFoundError(command.journalId);
    }
    return { journal, pageId: command.pageId };
  }

  private async read(journal: JournalContent, light: boolean): Promise<JournalView> {
    const pages = light
      ? journal.pages.map(toPageIndexEntry)
      : await Promise.all(journal.pages.map((page) => this.readPage(page)));
    return { ...journal, pages };
  }

  private async readPage(page: JournalPageContent): Promise<JournalPageView> {
    return { ...page, enrichedText: page.text !== null ? await this.enrich(page.text) : null };
  }

  /** Enrichment is a convenience: when it fails the reader still gets the raw text. */
  private async enrich(text: string): Promise<string | null> {
    try {
      return await this.deps.enricher.enrich(text);
    } catch {
      return text;
    }
  }

  private requireJournal(journalId: string): JournalIdentity {
    const journal = this.deps.journals.findJournal(journalId);
    if (journal === null) {
      throw new JournalNotFoundError(journalId);
    }
    return journal;
  }

  private requirePage(journalId: string, pageId: string): JournalPageSummary {
    const page = this.deps.journals.findPage(journalId, pageId);
    if (page === null) {
      throw new JournalPageNotFoundError(pageId);
    }
    return page;
  }

  /** A page is filed only under a category of its own journal; `null` takes it out of any. */
  private requirePageCategory(journalId: string, categoryId: string | null | undefined): void {
    if (categoryId === undefined) {
      return;
    }
    const categories = requireCategoryFeature(this.deps.categories);
    if (categoryId !== null) {
      requireCategory(categories, journalId, categoryId);
    }
  }
}
