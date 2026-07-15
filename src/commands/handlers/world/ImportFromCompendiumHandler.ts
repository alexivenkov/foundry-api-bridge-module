import type { ImportFromCompendiumParams, ImportFromCompendiumResult } from '@/commands/types';
import {
  createFoundryCompendiumImportService,
  importFromCompendiumRequestSchema,
  toImportDocumentCommand,
  type CompendiumGameProvider
} from '@/compendiums';
import { formatZodError } from '@/kernel';

export interface ImportFromCompendiumHandlerDependencies {
  gameProvider?: CompendiumGameProvider;
}

export function createImportFromCompendiumHandler(
  deps: ImportFromCompendiumHandlerDependencies = {}
): (params: ImportFromCompendiumParams) => Promise<ImportFromCompendiumResult> {
  const service = createFoundryCompendiumImportService(deps.gameProvider);

  return async function importFromCompendiumHandler(
    params: ImportFromCompendiumParams
  ): Promise<ImportFromCompendiumResult> {
    const parsed = importFromCompendiumRequestSchema.safeParse(params);
    if (!parsed.success) {
      throw new Error(formatZodError(parsed.error));
    }

    const result = await service.importDocument(toImportDocumentCommand(parsed.data));
    return {
      imported: true,
      worldId: result.worldId,
      uuid: result.uuid,
      name: result.name,
      documentType: result.documentType
    };
  };
}

export const importFromCompendiumHandler = createImportFromCompendiumHandler();
