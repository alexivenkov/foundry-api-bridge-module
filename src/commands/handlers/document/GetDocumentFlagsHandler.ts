import type { GetDocumentFlagsParams, GetDocumentFlagsResult } from '@/commands/types';
import { createFoundryDocumentFlagService, getDocumentFlagsRequestSchema, toGetFlagsQuery } from '@/core/documents';
import { parseRequest } from '@/core/shared';
import type { DocumentHandlerDependencies } from './GetDocumentOwnershipHandler';
import { toWireFlags } from './documentWireMappers';

export function createGetDocumentFlagsHandler(
  deps: DocumentHandlerDependencies = {}
): (params: GetDocumentFlagsParams) => Promise<GetDocumentFlagsResult> {
  const service = createFoundryDocumentFlagService(deps);

  return async function getDocumentFlagsHandler(params: GetDocumentFlagsParams): Promise<GetDocumentFlagsResult> {
    const query = toGetFlagsQuery(parseRequest(getDocumentFlagsRequestSchema, params));
    return toWireFlags(await service.getFlags(query));
  };
}

export const getDocumentFlagsHandler = createGetDocumentFlagsHandler();
