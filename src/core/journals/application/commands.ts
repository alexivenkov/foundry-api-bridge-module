import type {
  JournalAudience,
  JournalCategoryChanges,
  JournalCategoryDraft,
  JournalChanges,
  JournalDraft,
  JournalPageChanges,
  JournalPageDraft,
  NotePanView
} from '@/core/journals/domain';

export interface ListJournalsQuery {
  /** Index only: pages without text, markdown or enriched text, and no enrichment work. */
  readonly light: boolean;
}

export interface GetJournalQuery {
  readonly journalId: string;
}

export interface CreateJournalCommand {
  readonly draft: JournalDraft;
}

export interface UpdateJournalCommand {
  readonly journalId: string;
  readonly changes: JournalChanges;
}

export interface DeleteJournalCommand {
  readonly journalId: string;
}

export interface CreateJournalPageCommand {
  readonly journalId: string;
  readonly draft: JournalPageDraft;
}

export interface UpdateJournalPageCommand {
  readonly journalId: string;
  readonly pageId: string;
  readonly changes: JournalPageChanges;
}

export interface DeleteJournalPageCommand {
  readonly journalId: string;
  readonly pageId: string;
}

export interface ShowJournalCommand {
  readonly journalId: string;
  readonly pageId: string | undefined;
  readonly audience: JournalAudience;
}

export interface CreateJournalCategoryCommand {
  readonly journalId: string;
  readonly draft: JournalCategoryDraft;
}

export interface UpdateJournalCategoryCommand {
  readonly journalId: string;
  readonly categoryId: string;
  readonly changes: JournalCategoryChanges;
}

export interface DeleteJournalCategoryCommand {
  readonly journalId: string;
  readonly categoryId: string;
}

export interface ShowImageCommand {
  readonly src: string;
  readonly title?: string | undefined;
  readonly caption?: string | undefined;
  /** Empty: every connected user. */
  readonly users: readonly string[];
}

export interface PanToNoteCommand {
  readonly journalId: string;
  readonly view: NotePanView;
}

export interface SearchJournalsQuery {
  readonly query: string;
  readonly pageTypes?: readonly string[] | undefined;
  readonly searchContent?: boolean | undefined;
  readonly limit?: number | undefined;
  readonly offset?: number | undefined;
}
