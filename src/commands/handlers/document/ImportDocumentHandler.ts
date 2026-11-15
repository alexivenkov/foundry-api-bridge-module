import type { ImportDocumentParams, ImportDocumentResult } from '@/commands/types';
import {
  createFoundryDocumentTransferService,
  importDocumentRequestSchema,
  toImportDocumentCommand
} from '@/core/documents';
import { parseRequest } from '@/core/shared';
import type { DocumentHandlerDependencies } from './GetDocumentOwnershipHandler';
import { toWireImport } from './documentWireMappers';

export function createImportDocumentHandler(
  deps: DocumentHandlerDependencies = {}
): (params: ImportDocumentParams) => Promise<ImportDocumentResult> {
  const service = createFoundryDocumentTransferService(deps);

  return async function importDocumentHandler(params: ImportDocumentParams): Promise<ImportDocumentResult> {
    const command = toImportDocumentCommand(parseRequest(importDocumentRequestSchema, params));
    return toWireImport(await service.importDocument(command));
  };
}

export const importDocumentHandler = createImportDocumentHandler();
