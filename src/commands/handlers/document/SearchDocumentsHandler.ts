import type { SearchDocumentsParams, SearchDocumentsResult } from '@/commands/types';
import {
  createFoundryDocumentSearchService,
  searchDocumentsRequestSchema,
  toDocumentSearchQuery
} from '@/core/documents';
import { parseRequest } from '@/core/shared';
import type { DocumentHandlerDependencies } from './GetDocumentOwnershipHandler';
import { toWireSearchResult } from './documentWireMappers';

export function createSearchDocumentsHandler(
  deps: DocumentHandlerDependencies = {}
): (params: SearchDocumentsParams) => Promise<SearchDocumentsResult> {
  const service = createFoundryDocumentSearchService(deps);

  return async function searchDocumentsHandler(params: SearchDocumentsParams): Promise<SearchDocumentsResult> {
    const query = toDocumentSearchQuery(parseRequest(searchDocumentsRequestSchema, params));
    return toWireSearchResult(await service.search(query));
  };
}

export const searchDocumentsHandler = createSearchDocumentsHandler();
