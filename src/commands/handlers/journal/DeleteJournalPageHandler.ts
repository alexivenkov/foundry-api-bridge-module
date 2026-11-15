import type { DeleteJournalPageParams, DeleteResult } from '@/commands/types';
import {
  createFoundryJournalService,
  deleteJournalPageRequestSchema,
  toDeleteJournalPageCommand
} from '@/core/journals';
import { parseRequest } from '@/core/shared';
import type { JournalHandlerDependencies } from './journalWireMappers';

export function createDeleteJournalPageHandler(
  deps: JournalHandlerDependencies = {}
): (params: DeleteJournalPageParams) => Promise<DeleteResult> {
  const service = createFoundryJournalService(deps.globals);

  return async function deleteJournalPageHandler(params: DeleteJournalPageParams): Promise<DeleteResult> {
    await service.deletePage(toDeleteJournalPageCommand(parseRequest(deleteJournalPageRequestSchema, params)));
    return { deleted: true };
  };
}

export const deleteJournalPageHandler = createDeleteJournalPageHandler();
