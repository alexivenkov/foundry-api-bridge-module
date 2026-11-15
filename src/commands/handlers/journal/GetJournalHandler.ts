import type { GetJournalParams, JournalDetailData } from '@/commands/types';
import { createFoundryJournalService, getJournalRequestSchema, toGetJournalQuery } from '@/core/journals';
import { parseRequest } from '@/core/shared';
import { toWireJournalDetailData, type JournalHandlerDependencies } from './journalWireMappers';

export function createGetJournalHandler(
  deps: JournalHandlerDependencies = {}
): (params: GetJournalParams) => Promise<JournalDetailData> {
  const service = createFoundryJournalService(deps.globals, deps.generation);

  return async function getJournalHandler(params: GetJournalParams): Promise<JournalDetailData> {
    const query = toGetJournalQuery(parseRequest(getJournalRequestSchema, params));
    return toWireJournalDetailData(await service.getJournal(query));
  };
}

export const getJournalHandler = createGetJournalHandler();
