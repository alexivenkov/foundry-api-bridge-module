/** The JournalEntryCategory fields the context reads and writes (`BaseJournalEntryCategory` schema, Foundry 13–14). */
export interface FoundryJournalCategory {
  id: string;
  /** Prepared: a blank stored name reads as the localized "Unnamed Category". */
  name: string;
  sort: number;
  update(data: Record<string, unknown>): Promise<unknown>;
}

/** `JournalEntry#categories`, an embedded collection that exists from Foundry 13. */
export interface FoundryJournalCategories {
  get(id: string): FoundryJournalCategory | undefined;
  forEach(visit: (category: FoundryJournalCategory) => void): void;
}
