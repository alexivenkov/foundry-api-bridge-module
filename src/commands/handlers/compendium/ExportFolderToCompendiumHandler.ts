import type { ExportFolderToCompendiumParams, ExportFolderToCompendiumResult } from '@/commands/types';
import {
  createFoundryCompendiumWritingService,
  exportFolderToCompendiumRequestSchema,
  toExportFolderCommand
} from '@/compendiums';
import { parseRequest } from '@/core/shared';
import type { CompendiumHandlerDependencies } from './GetCompendiumInfoHandler';

export function createExportFolderToCompendiumHandler(
  deps: CompendiumHandlerDependencies = {}
): (params: ExportFolderToCompendiumParams) => Promise<ExportFolderToCompendiumResult> {
  const service = createFoundryCompendiumWritingService(deps);

  return async function exportFolderToCompendiumHandler(
    params: ExportFolderToCompendiumParams
  ): Promise<ExportFolderToCompendiumResult> {
    const command = toExportFolderCommand(parseRequest(exportFolderToCompendiumRequestSchema, params));
    const outcome = await service.exportFolder(command);
    return {
      packId: command.packId,
      folderId: command.folderId,
      exportedCount: outcome.exportedCount,
      createdCount: outcome.createdCount,
      updatedCount: outcome.updatedCount,
      documentCount: outcome.documentCount
    };
  };
}

export const exportFolderToCompendiumHandler = createExportFolderToCompendiumHandler();
