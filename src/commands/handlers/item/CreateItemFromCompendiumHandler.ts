import type { CreateItemFromCompendiumParams, WorldItemResult } from '@/commands/types';
import {
  PackDocumentNotFoundError,
  PackNotFoundError,
  createFoundryCompendiumImportService,
  createItemFromCompendiumRequestSchema,
  toImportItemCommand,
  type CompendiumGameProvider
} from '@/compendiums';
import { formatZodError } from '@/kernel';

export interface CreateItemFromCompendiumHandlerDependencies {
  gameProvider?: CompendiumGameProvider;
}

export function createCreateItemFromCompendiumHandler(
  deps: CreateItemFromCompendiumHandlerDependencies = {}
): (params: CreateItemFromCompendiumParams) => Promise<WorldItemResult> {
  const service = createFoundryCompendiumImportService(deps.gameProvider);

  return async function createItemFromCompendiumHandler(
    params: CreateItemFromCompendiumParams
  ): Promise<WorldItemResult> {
    const parsed = createItemFromCompendiumRequestSchema.safeParse(params);
    if (!parsed.success) {
      throw new Error(formatZodError(parsed.error));
    }

    try {
      const item = await service.importItem(toImportItemCommand(parsed.data));
      return {
        id: item.id,
        uuid: item.uuid,
        name: item.name,
        type: item.type,
        img: item.img,
        folder: item.folderName
      };
    } catch (error) {
      // Legacy wire flavor of this command differs from the domain wording.
      if (error instanceof PackNotFoundError) {
        throw new Error(`Compendium pack not found: ${error.packId}`);
      }
      if (error instanceof PackDocumentNotFoundError) {
        throw new Error(`Item not found in compendium: ${error.documentId}`);
      }
      throw error;
    }
  };
}

export const createItemFromCompendiumHandler = createCreateItemFromCompendiumHandler();
