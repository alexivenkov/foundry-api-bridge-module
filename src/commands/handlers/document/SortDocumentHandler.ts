import type { SortDocumentParams, SortDocumentResult } from '@/commands/types';
import { createFoundryDocumentSortService, sortDocumentRequestSchema, toSortDocumentCommand } from '@/core/documents';
import { parseRequest } from '@/core/shared';
import type { DocumentHandlerDependencies } from './GetDocumentOwnershipHandler';
import { toWireSortResult } from './documentWireMappers';

export function createSortDocumentHandler(
  deps: DocumentHandlerDependencies = {}
): (params: SortDocumentParams) => Promise<SortDocumentResult> {
  const service = createFoundryDocumentSortService(deps);

  return async function sortDocumentHandler(params: SortDocumentParams): Promise<SortDocumentResult> {
    const command = toSortDocumentCommand(parseRequest(sortDocumentRequestSchema, params));
    return toWireSortResult(await service.sortDocument(command));
  };
}

export const sortDocumentHandler = createSortDocumentHandler();
