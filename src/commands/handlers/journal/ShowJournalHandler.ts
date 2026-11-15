import type { ShowJournalParams, ShowJournalResult } from '@/commands/types';
import { createFoundryJournalService, showJournalRequestSchema, toShowJournalCommand } from '@/core/journals';
import { parseRequest } from '@/core/shared';
import type { JournalHandlerDependencies } from './journalWireMappers';

export function createShowJournalHandler(
  deps: JournalHandlerDependencies = {}
): (params: ShowJournalParams) => Promise<ShowJournalResult> {
  const service = createFoundryJournalService(deps.globals);

  return async function showJournalHandler(params: ShowJournalParams): Promise<ShowJournalResult> {
    const command = toShowJournalCommand(parseRequest(showJournalRequestSchema, params));
    const { journal, pageId } = await service.showJournal(command);

    const result: ShowJournalResult = { shown: true, journalId: journal.id, journalName: journal.name };
    if (pageId !== undefined) {
      result.pageId = pageId;
    }
    return result;
  };
}

export const showJournalHandler = createShowJournalHandler();
