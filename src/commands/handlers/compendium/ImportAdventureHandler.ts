import type { ImportAdventureParams, ImportAdventureResult } from '@/commands/types';
import {
  createFoundryAdventureImportService,
  importAdventureRequestSchema,
  toImportAdventureCommand
} from '@/compendiums';
import { parseRequest } from '@/core/shared';
import type { CompendiumHandlerDependencies } from './GetCompendiumInfoHandler';
import { toWireAdventureImport } from './compendiumManagementWireMappers';

export function createImportAdventureHandler(
  deps: CompendiumHandlerDependencies = {}
): (params: ImportAdventureParams) => Promise<ImportAdventureResult> {
  const service = createFoundryAdventureImportService(deps);

  return async function importAdventureHandler(params: ImportAdventureParams): Promise<ImportAdventureResult> {
    const command = toImportAdventureCommand(parseRequest(importAdventureRequestSchema, params));
    return toWireAdventureImport(await service.importAdventure(command));
  };
}

export const importAdventureHandler = createImportAdventureHandler();
