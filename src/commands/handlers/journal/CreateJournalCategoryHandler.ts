import type { CreateJournalCategoryParams, JournalCategoryResult } from '@/commands/types';
import {
  createFoundryJournalCategoryService,
  createJournalCategoryRequestSchema,
  toCreateJournalCategoryCommand
} from '@/core/journals';
import { parseRequest } from '@/core/shared';
import { toWireJournalCategoryResult, type JournalHandlerDependencies } from './journalWireMappers';

export function createCreateJournalCategoryHandler(
  deps: JournalHandlerDependencies = {}
): (params: CreateJournalCategoryParams) => Promise<JournalCategoryResult> {
  const service = createFoundryJournalCategoryService(deps.globals, deps.generation);

  return async function createJournalCategoryHandler(
    params: CreateJournalCategoryParams
  ): Promise<JournalCategoryResult> {
    const command = toCreateJournalCategoryCommand(parseRequest(createJournalCategoryRequestSchema, params));
    return toWireJournalCategoryResult(command.journalId, await service.createCategory(command));
  };
}

export const createJournalCategoryHandler = createCreateJournalCategoryHandler();
