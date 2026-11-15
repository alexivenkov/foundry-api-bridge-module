import type { JournalCategoryResult, UpdateJournalCategoryParams } from '@/commands/types';
import {
  createFoundryJournalCategoryService,
  toUpdateJournalCategoryCommand,
  updateJournalCategoryRequestSchema
} from '@/core/journals';
import { parseRequest } from '@/core/shared';
import { toWireJournalCategoryResult, type JournalHandlerDependencies } from './journalWireMappers';

export function createUpdateJournalCategoryHandler(
  deps: JournalHandlerDependencies = {}
): (params: UpdateJournalCategoryParams) => Promise<JournalCategoryResult> {
  const service = createFoundryJournalCategoryService(deps.globals, deps.generation);

  return async function updateJournalCategoryHandler(
    params: UpdateJournalCategoryParams
  ): Promise<JournalCategoryResult> {
    const command = toUpdateJournalCategoryCommand(parseRequest(updateJournalCategoryRequestSchema, params));
    return toWireJournalCategoryResult(command.journalId, await service.updateCategory(command));
  };
}

export const updateJournalCategoryHandler = createUpdateJournalCategoryHandler();
