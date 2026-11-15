import type { ImportCompendiumFolderParams, ImportCompendiumFolderResult } from '@/commands/types';
import {
  createFoundryCompendiumBulkImportService,
  importCompendiumFolderRequestSchema,
  toImportPackFolderCommand
} from '@/compendiums';
import { parseRequest } from '@/core/shared';
import type { CompendiumHandlerDependencies } from './GetCompendiumInfoHandler';
import { toWireSkippedScriptMacros } from './compendiumManagementWireMappers';

export function createImportCompendiumFolderHandler(
  deps: CompendiumHandlerDependencies = {}
): (params: ImportCompendiumFolderParams) => Promise<ImportCompendiumFolderResult> {
  const service = createFoundryCompendiumBulkImportService(deps);

  return async function importCompendiumFolderHandler(
    params: ImportCompendiumFolderParams
  ): Promise<ImportCompendiumFolderResult> {
    const command = toImportPackFolderCommand(parseRequest(importCompendiumFolderRequestSchema, params));
    const outcome = await service.importPackFolder(command);
    return {
      packId: command.packId,
      packFolderId: command.packFolderId,
      folder: { id: outcome.folder.id, name: outcome.folder.name },
      createdFolderCount: outcome.createdFolderCount,
      importedCount: outcome.documents.length,
      documents: outcome.documents.map(document => ({ id: document.id, name: document.name })),
      ...toWireSkippedScriptMacros(outcome.skippedScriptMacros)
    };
  };
}

export const importCompendiumFolderHandler = createImportCompendiumFolderHandler();
