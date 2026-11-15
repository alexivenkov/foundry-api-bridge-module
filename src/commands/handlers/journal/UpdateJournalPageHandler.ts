import type { UpdateJournalPageParams, JournalPageDetailResult } from '@/commands/types';
import {
  createFoundryJournalService,
  toUpdateJournalPageCommand,
  updateJournalPageRequestSchema
} from '@/core/journals';
import { parseRequest } from '@/core/shared';
import { toWireJournalPageDetail, type JournalHandlerDependencies } from './journalWireMappers';

export function createUpdateJournalPageHandler(
  deps: JournalHandlerDependencies = {}
): (params: UpdateJournalPageParams) => Promise<JournalPageDetailResult> {
  const service = createFoundryJournalService(deps.globals, deps.generation);

  return async function updateJournalPageHandler(params: UpdateJournalPageParams): Promise<JournalPageDetailResult> {
    const command = toUpdateJournalPageCommand(parseRequest(updateJournalPageRequestSchema, params));
    return toWireJournalPageDetail(await service.updatePage(command));
  };
}

export const updateJournalPageHandler = createUpdateJournalPageHandler();
