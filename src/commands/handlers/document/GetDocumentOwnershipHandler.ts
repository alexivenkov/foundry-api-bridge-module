import type { DocumentOwnershipResult, GetDocumentOwnershipParams } from '@/commands/types';
import {
  createFoundryDocumentOwnershipService,
  documentUuidRequestSchema,
  toDocumentQuery,
  type DocumentWiring
} from '@/core/documents';
import { parseRequest } from '@/core/shared';
import { toWireOwnership } from './documentWireMappers';

export type DocumentHandlerDependencies = DocumentWiring;

export function createGetDocumentOwnershipHandler(
  deps: DocumentHandlerDependencies = {}
): (params: GetDocumentOwnershipParams) => Promise<DocumentOwnershipResult> {
  const service = createFoundryDocumentOwnershipService(deps);

  return async function getDocumentOwnershipHandler(
    params: GetDocumentOwnershipParams
  ): Promise<DocumentOwnershipResult> {
    const query = toDocumentQuery(parseRequest(documentUuidRequestSchema, params));
    return toWireOwnership(await service.getOwnership(query));
  };
}

export const getDocumentOwnershipHandler = createGetDocumentOwnershipHandler();
