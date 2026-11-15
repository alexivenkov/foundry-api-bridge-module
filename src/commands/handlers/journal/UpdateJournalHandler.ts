import type { UpdateJournalParams, JournalResult } from '@/commands/types';
import { createFoundryJournalService, toUpdateJournalCommand, updateJournalRequestSchema } from '@/core/journals';
import { parseRequest } from '@/core/shared';
import { toWireJournalResult, type JournalHandlerDependencies } from './journalWireMappers';

export function createUpdateJournalHandler(
  deps: JournalHandlerDependencies = {}
): (params: UpdateJournalParams) => Promise<JournalResult> {
  const service = createFoundryJournalService(deps.globals);

  return async function updateJournalHandler(params: UpdateJournalParams): Promise<JournalResult> {
    const command = toUpdateJournalCommand(parseRequest(updateJournalRequestSchema, params));
    return toWireJournalResult(await service.updateJournal(command));
  };
}

export const updateJournalHandler = createUpdateJournalHandler();
