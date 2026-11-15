import type { ExportDocumentParams, ExportDocumentResult } from '@/commands/types';
import { createFoundryDocumentTransferService, documentUuidRequestSchema, toDocumentQuery } from '@/core/documents';
import { parseRequest } from '@/core/shared';
import type { DocumentHandlerDependencies } from './GetDocumentOwnershipHandler';
import { toWireExport } from './documentWireMappers';

export function createExportDocumentHandler(
  deps: DocumentHandlerDependencies = {}
): (params: ExportDocumentParams) => Promise<ExportDocumentResult> {
  const service = createFoundryDocumentTransferService(deps);

  return async function exportDocumentHandler(params: ExportDocumentParams): Promise<ExportDocumentResult> {
    const query = toDocumentQuery(parseRequest(documentUuidRequestSchema, params));
    return toWireExport(await service.exportDocument(query));
  };
}

export const exportDocumentHandler = createExportDocumentHandler();
