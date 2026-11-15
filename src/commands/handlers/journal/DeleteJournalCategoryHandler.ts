import type { DeleteJournalCategoryParams, DeleteJournalCategoryResult } from '@/commands/types';
import {
  createFoundryJournalCategoryService,
  deleteJournalCategoryRequestSchema,
  toDeleteJournalCategoryCommand
} from '@/core/journals';
import { parseRequest } from '@/core/shared';
import type { JournalHandlerDependencies } from './journalWireMappers';

export function createDeleteJournalCategoryHandler(
  deps: JournalHandlerDependencies = {}
): (params: DeleteJournalCategoryParams) => Promise<DeleteJournalCategoryResult> {
  const service = createFoundryJournalCategoryService(deps.globals, deps.generation);

  return async function deleteJournalCategoryHandler(
    params: DeleteJournalCategoryParams
  ): Promise<DeleteJournalCategoryResult> {
    const command = toDeleteJournalCategoryCommand(parseRequest(deleteJournalCategoryRequestSchema, params));
    await service.deleteCategory(command);
    return { deleted: true, categoryId: command.categoryId, journalId: command.journalId };
  };
}

export const deleteJournalCategoryHandler = createDeleteJournalCategoryHandler();
