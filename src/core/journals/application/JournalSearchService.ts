import {
  JOURNAL_SEARCH_DEFAULT_LIMIT,
  searchJournals,
  type JournalSearchOutcome,
  type JournalStore
} from '@/core/journals/domain';
import type { SearchJournalsQuery } from './commands';

export interface JournalSearchServiceDependencies {
  readonly journals: JournalStore;
}

/** Full-text search over the world's journal entries. */
export class JournalSearchService {
  constructor(private readonly deps: JournalSearchServiceDependencies) {}

  search(query: SearchJournalsQuery): JournalSearchOutcome {
    return searchJournals(this.deps.journals.listJournals(), {
      query: query.query,
      pageTypes: query.pageTypes,
      searchContent: query.searchContent ?? true,
      limit: query.limit ?? JOURNAL_SEARCH_DEFAULT_LIMIT,
      offset: query.offset ?? 0
    });
  }
}
