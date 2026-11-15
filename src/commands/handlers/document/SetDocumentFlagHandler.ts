import type { SetDocumentFlagParams, SetDocumentFlagResult } from '@/commands/types';
import { createFoundryDocumentFlagService, setDocumentFlagRequestSchema, toSetFlagCommand } from '@/core/documents';
import { parseRequest } from '@/core/shared';
import type { DocumentHandlerDependencies } from './GetDocumentOwnershipHandler';
import { toWireFlagValue } from './documentWireMappers';

export function createSetDocumentFlagHandler(
  deps: DocumentHandlerDependencies = {}
): (params: SetDocumentFlagParams) => Promise<SetDocumentFlagResult> {
  const service = createFoundryDocumentFlagService(deps);

  return async function setDocumentFlagHandler(params: SetDocumentFlagParams): Promise<SetDocumentFlagResult> {
    const command = toSetFlagCommand(parseRequest(setDocumentFlagRequestSchema, params));
    return toWireFlagValue(await service.setFlag(command));
  };
}

export const setDocumentFlagHandler = createSetDocumentFlagHandler();
