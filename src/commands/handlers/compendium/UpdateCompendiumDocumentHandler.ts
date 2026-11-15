import type { UpdateCompendiumDocumentParams, UpdateCompendiumDocumentResult } from '@/commands/types';
import {
  createFoundryCompendiumWritingService,
  toUpdatePackDocumentCommand,
  updateCompendiumDocumentRequestSchema
} from '@/compendiums';
import { parseRequest } from '@/core/shared';
import type { CompendiumHandlerDependencies } from './GetCompendiumInfoHandler';
import { toWireDocumentRef } from './compendiumManagementWireMappers';

export function createUpdateCompendiumDocumentHandler(
  deps: CompendiumHandlerDependencies = {}
): (params: UpdateCompendiumDocumentParams) => Promise<UpdateCompendiumDocumentResult> {
  const service = createFoundryCompendiumWritingService(deps);

  return async function updateCompendiumDocumentHandler(
    params: UpdateCompendiumDocumentParams
  ): Promise<UpdateCompendiumDocumentResult> {
    const command = toUpdatePackDocumentCommand(parseRequest(updateCompendiumDocumentRequestSchema, params));
    const document = await service.updateDocument(command);
    return { packId: command.packId, document: toWireDocumentRef(document) };
  };
}

export const updateCompendiumDocumentHandler = createUpdateCompendiumDocumentHandler();
