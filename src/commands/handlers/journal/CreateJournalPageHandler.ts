import type { CreateJournalPageParams, JournalPageDetailResult } from '@/commands/types';
import {
  createFoundryJournalService,
  createJournalPageRequestSchema,
  toCreateJournalPageCommand
} from '@/core/journals';
import { parseRequest } from '@/core/shared';
import { toWireJournalPageDetail, type JournalHandlerDependencies } from './journalWireMappers';

export function createCreateJournalPageHandler(
  deps: JournalHandlerDependencies = {}
): (params: CreateJournalPageParams) => Promise<JournalPageDetailResult> {
  const service = createFoundryJournalService(deps.globals, deps.generation);

  return async function createJournalPageHandler(params: CreateJournalPageParams): Promise<JournalPageDetailResult> {
    const command = toCreateJournalPageCommand(parseRequest(createJournalPageRequestSchema, params));
    return toWireJournalPageDetail(await service.createPage(command));
  };
}

export const createJournalPageHandler = createCreateJournalPageHandler();
