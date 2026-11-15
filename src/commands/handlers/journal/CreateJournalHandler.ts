import type { CreateJournalParams, JournalResult } from '@/commands/types';
import { createFoundryJournalService, createJournalRequestSchema, toCreateJournalCommand } from '@/core/journals';
import { parseRequest } from '@/core/shared';
import { toWireJournalResult, type JournalHandlerDependencies } from './journalWireMappers';

export function createCreateJournalHandler(
  deps: JournalHandlerDependencies = {}
): (params: CreateJournalParams) => Promise<JournalResult> {
  const service = createFoundryJournalService(deps.globals);

  return async function createJournalHandler(params: CreateJournalParams): Promise<JournalResult> {
    const command = toCreateJournalCommand(parseRequest(createJournalRequestSchema, params));
    return toWireJournalResult(await service.createJournal(command));
  };
}

export const createJournalHandler = createCreateJournalHandler();
