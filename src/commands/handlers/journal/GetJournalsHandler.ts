import type { GetJournalsParams } from '@/commands/types';
import { createFoundryJournalService, getJournalsRequestSchema, toListJournalsQuery } from '@/core/journals';
import { parseRequest } from '@/core/shared';
import type { JournalData } from '@/types/foundry';
import { toWireJournalData, type JournalHandlerDependencies } from './journalWireMappers';

export function createGetJournalsHandler(
  deps: JournalHandlerDependencies = {}
): (params: GetJournalsParams) => Promise<JournalData[]> {
  const service = createFoundryJournalService(deps.globals);

  return async function getJournalsHandler(params: GetJournalsParams): Promise<JournalData[]> {
    const journals = await service.listJournals(toListJournalsQuery(parseRequest(getJournalsRequestSchema, params)));
    return journals.map(toWireJournalData);
  };
}

export const getJournalsHandler = createGetJournalsHandler();
