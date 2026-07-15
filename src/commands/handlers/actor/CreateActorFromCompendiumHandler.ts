import type { ActorResult, CreateActorFromCompendiumParams } from '@/commands/types';
import {
  PackDocumentNotFoundError,
  PackNotFoundError,
  createActorFromCompendiumRequestSchema,
  createFoundryCompendiumImportService,
  toImportActorCommand,
  type CompendiumGameProvider
} from '@/compendiums';
import { formatZodError } from '@/kernel';

export interface CreateActorFromCompendiumHandlerDependencies {
  gameProvider?: CompendiumGameProvider;
}

export function createCreateActorFromCompendiumHandler(
  deps: CreateActorFromCompendiumHandlerDependencies = {}
): (params: CreateActorFromCompendiumParams) => Promise<ActorResult> {
  const service = createFoundryCompendiumImportService(deps.gameProvider);

  return async function createActorFromCompendiumHandler(
    params: CreateActorFromCompendiumParams
  ): Promise<ActorResult> {
    const parsed = createActorFromCompendiumRequestSchema.safeParse(params);
    if (!parsed.success) {
      throw new Error(formatZodError(parsed.error));
    }

    try {
      const actor = await service.importActor(toImportActorCommand(parsed.data));
      return {
        id: actor.id,
        uuid: actor.uuid,
        name: actor.name,
        type: actor.type,
        img: actor.img,
        folder: actor.folderName
      };
    } catch (error) {
      // Legacy wire flavor of this command differs from the domain wording.
      if (error instanceof PackNotFoundError) {
        throw new Error(`Compendium pack not found: ${error.packId}`);
      }
      if (error instanceof PackDocumentNotFoundError) {
        throw new Error(`Actor not found in compendium: ${error.documentId}`);
      }
      throw error;
    }
  };
}

export const createActorFromCompendiumHandler = createCreateActorFromCompendiumHandler();
