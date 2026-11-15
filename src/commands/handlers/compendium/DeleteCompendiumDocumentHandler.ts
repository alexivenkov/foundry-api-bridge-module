import type { DeleteCompendiumDocumentParams, DeleteCompendiumDocumentResult } from '@/commands/types';
import {
  createFoundryCompendiumWritingService,
  packDocumentRequestSchema,
  toDeletePackDocumentCommand
} from '@/compendiums';
import { parseRequest } from '@/core/shared';
import type { CompendiumHandlerDependencies } from './GetCompendiumInfoHandler';

export function createDeleteCompendiumDocumentHandler(
  deps: CompendiumHandlerDependencies = {}
): (params: DeleteCompendiumDocumentParams) => Promise<DeleteCompendiumDocumentResult> {
  const service = createFoundryCompendiumWritingService(deps);

  return async function deleteCompendiumDocumentHandler(
    params: DeleteCompendiumDocumentParams
  ): Promise<DeleteCompendiumDocumentResult> {
    const command = toDeletePackDocumentCommand(parseRequest(packDocumentRequestSchema, params));
    const deleted = await service.deleteDocument(command);
    return { deleted: true, packId: deleted.packId, documentId: deleted.documentId, name: deleted.name };
  };
}

export const deleteCompendiumDocumentHandler = createDeleteCompendiumDocumentHandler();
