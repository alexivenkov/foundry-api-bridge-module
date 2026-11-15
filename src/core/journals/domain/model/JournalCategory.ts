/** A category of a journal entry (Foundry 13+): pages filed under it are listed together. */
export interface JournalCategory {
  readonly id: string;
  readonly name: string;
  readonly sort: number;
}

export interface JournalCategoryDraft {
  readonly name: string;
  /** Left out, the category goes after the journal's last one. */
  readonly sort?: number | undefined;
}

/** An omitted attribute is left untouched. */
export interface JournalCategoryChanges {
  readonly name?: string | undefined;
  readonly sort?: number | undefined;
}

export const JOURNAL_CATEGORIES_SINCE_GENERATION = 13;
