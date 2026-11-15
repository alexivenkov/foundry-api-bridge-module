import type { ImportCompendiumParams, ImportCompendiumResult } from '@/commands/types';
import {
  createFoundryCompendiumBulkImportService,
  importCompendiumRequestSchema,
  toImportPackCommand
} from '@/compendiums';
import { parseRequest } from '@/core/shared';
import type { CompendiumHandlerDependencies } from './GetCompendiumInfoHandler';
import { toWireSkippedScriptMacros } from './compendiumManagementWireMappers';

export function createImportCompendiumHandler(
  deps: CompendiumHandlerDependencies = {}
): (params: ImportCompendiumParams) => Promise<ImportCompendiumResult> {
  const service = createFoundryCompendiumBulkImportService(deps);

  return async function importCompendiumHandler(params: ImportCompendiumParams): Promise<ImportCompendiumResult> {
    const command = toImportPackCommand(parseRequest(importCompendiumRequestSchema, params));
    const outcome = await service.importPack(command);
    return {
      packId: command.packId,
      folder: outcome.folder ? { id: outcome.folder.id, name: outcome.folder.name } : null,
      importedCount: outcome.documents.length,
      documents: outcome.documents.map(document => ({ id: document.id, name: document.name })),
      ...toWireSkippedScriptMacros(outcome.skippedScriptMacros)
    };
  };
}

export const importCompendiumHandler = createImportCompendiumHandler();
