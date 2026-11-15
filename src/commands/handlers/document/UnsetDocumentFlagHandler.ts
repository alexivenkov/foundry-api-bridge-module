import type { UnsetDocumentFlagParams, UnsetDocumentFlagResult } from '@/commands/types';
import { createFoundryDocumentFlagService, toUnsetFlagCommand, unsetDocumentFlagRequestSchema } from '@/core/documents';
import { parseRequest } from '@/core/shared';
import type { DocumentHandlerDependencies } from './GetDocumentOwnershipHandler';
import { toWireFlagRemoval } from './documentWireMappers';

export function createUnsetDocumentFlagHandler(
  deps: DocumentHandlerDependencies = {}
): (params: UnsetDocumentFlagParams) => Promise<UnsetDocumentFlagResult> {
  const service = createFoundryDocumentFlagService(deps);

  return async function unsetDocumentFlagHandler(params: UnsetDocumentFlagParams): Promise<UnsetDocumentFlagResult> {
    const command = toUnsetFlagCommand(parseRequest(unsetDocumentFlagRequestSchema, params));
    return toWireFlagRemoval(await service.unsetFlag(command));
  };
}

export const unsetDocumentFlagHandler = createUnsetDocumentFlagHandler();
