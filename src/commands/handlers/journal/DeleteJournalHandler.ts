import type { DeleteJournalParams, DeleteResult } from '@/commands/types';
import { createFoundryJournalService, deleteJournalRequestSchema, toDeleteJournalCommand } from '@/core/journals';
import { parseRequest } from '@/core/shared';
import type { JournalHandlerDependencies } from './journalWireMappers';

export function createDeleteJournalHandler(
  deps: JournalHandlerDependencies = {}
): (params: DeleteJournalParams) => Promise<DeleteResult> {
  const service = createFoundryJournalService(deps.globals);

  return async function deleteJournalHandler(params: DeleteJournalParams): Promise<DeleteResult> {
    await service.deleteJournal(toDeleteJournalCommand(parseRequest(deleteJournalRequestSchema, params)));
    return { deleted: true };
  };
}

export const deleteJournalHandler = createDeleteJournalHandler();
