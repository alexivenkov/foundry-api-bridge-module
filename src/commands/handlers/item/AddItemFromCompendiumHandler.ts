import type { AddItemFromCompendiumParams, ItemResult } from '@/commands/types';
import {
  PackDocumentNotFoundError,
  PackNotFoundError,
  addItemFromCompendiumRequestSchema,
  createFoundryCompendiumImportService,
  toAddItemToActorCommand,
  type CompendiumGameProvider
} from '@/compendiums';
import { formatZodError } from '@/kernel';

export interface AddItemFromCompendiumHandlerDependencies {
  gameProvider?: CompendiumGameProvider;
}

export function createAddItemFromCompendiumHandler(
  deps: AddItemFromCompendiumHandlerDependencies = {}
): (params: AddItemFromCompendiumParams) => Promise<ItemResult> {
  const service = createFoundryCompendiumImportService(deps.gameProvider);

  return async function addItemFromCompendiumHandler(
    params: AddItemFromCompendiumParams
  ): Promise<ItemResult> {
    const parsed = addItemFromCompendiumRequestSchema.safeParse(params);
    if (!parsed.success) {
      throw new Error(formatZodError(parsed.error));
    }

    try {
      const result = await service.addItemToActor(toAddItemToActorCommand(parsed.data));
      return {
        id: result.item.id,
        name: result.item.name,
        type: result.item.type,
        img: result.item.img,
        actorId: result.actor.id,
        actorName: result.actor.name
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

export const addItemFromCompendiumHandler = createAddItemFromCompendiumHandler();
