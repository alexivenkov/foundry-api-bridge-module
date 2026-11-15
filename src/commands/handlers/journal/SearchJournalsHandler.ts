import type { SearchJournalsParams, SearchJournalsResult } from '@/commands/types';
import { createFoundryJournalSearchService, searchJournalsRequestSchema, toSearchJournalsQuery } from '@/core/journals';
import { parseRequest } from '@/core/shared';
import { toWireSearchJournalsResult, type JournalHandlerDependencies } from './journalWireMappers';

export function createSearchJournalsHandler(
  deps: JournalHandlerDependencies = {}
): (params: SearchJournalsParams) => Promise<SearchJournalsResult> {
  const service = createFoundryJournalSearchService(deps.globals);

  return function searchJournalsHandler(params: SearchJournalsParams): Promise<SearchJournalsResult> {
    try {
      const query = toSearchJournalsQuery(parseRequest(searchJournalsRequestSchema, params));
      return Promise.resolve(toWireSearchJournalsResult(service.search(query)));
    } catch (error) {
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }
  };
}

export const searchJournalsHandler = createSearchJournalsHandler();
