import type { ExportToCompendiumParams, ExportToCompendiumResult } from '@/commands/types';
import {
  createFoundryCompendiumWritingService,
  exportToCompendiumRequestSchema,
  toExportDocumentCommand
} from '@/compendiums';
import { parseRequest } from '@/core/shared';
import type { CompendiumHandlerDependencies } from './GetCompendiumInfoHandler';
import { toWireDocumentRef } from './compendiumManagementWireMappers';

export function createExportToCompendiumHandler(
  deps: CompendiumHandlerDependencies = {}
): (params: ExportToCompendiumParams) => Promise<ExportToCompendiumResult> {
  const service = createFoundryCompendiumWritingService(deps);

  return async function exportToCompendiumHandler(
    params: ExportToCompendiumParams
  ): Promise<ExportToCompendiumResult> {
    const command = toExportDocumentCommand(parseRequest(exportToCompendiumRequestSchema, params));
    const exported = await service.exportDocument(command);
    return { packId: exported.packId, sourceId: exported.sourceId, document: toWireDocumentRef(exported.document) };
  };
}

export const exportToCompendiumHandler = createExportToCompendiumHandler();
