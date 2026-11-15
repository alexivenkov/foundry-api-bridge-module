import type { DocumentOwnershipResult, SetDocumentOwnershipParams } from '@/commands/types';
import {
  createFoundryDocumentOwnershipService,
  setDocumentOwnershipRequestSchema,
  toSetOwnershipCommand
} from '@/core/documents';
import { parseRequest } from '@/core/shared';
import type { DocumentHandlerDependencies } from './GetDocumentOwnershipHandler';
import { toWireOwnership } from './documentWireMappers';

export function createSetDocumentOwnershipHandler(
  deps: DocumentHandlerDependencies = {}
): (params: SetDocumentOwnershipParams) => Promise<DocumentOwnershipResult> {
  const service = createFoundryDocumentOwnershipService(deps);

  return async function setDocumentOwnershipHandler(
    params: SetDocumentOwnershipParams
  ): Promise<DocumentOwnershipResult> {
    const command = toSetOwnershipCommand(parseRequest(setDocumentOwnershipRequestSchema, params));
    return toWireOwnership(await service.setOwnership(command));
  };
}

export const setDocumentOwnershipHandler = createSetDocumentOwnershipHandler();
