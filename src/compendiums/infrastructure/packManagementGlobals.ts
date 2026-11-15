import { foundryGeneration } from '@/compat/foundryVersion';
import type { FoundryAdventureClass } from './foundryAdventureTypes';
import type {
  FoundryCompendiumCollectionClass,
  FoundryFolderClass,
  FoundryManagementGame,
  PackManagementGameProvider,
  PackManagementGlobals
} from './foundryPackManagementTypes';

interface ManagementGlobalScope {
  game: FoundryManagementGame;
  foundry?: { documents?: { collections?: { CompendiumCollection?: FoundryCompendiumCollectionClass } } };
  CompendiumCollection?: FoundryCompendiumCollectionClass;
  CONST?: { COMPENDIUM_DOCUMENT_TYPES?: readonly string[] };
  CONFIG?: {
    Adventure?: { documentClass?: FoundryAdventureClass };
    Folder?: { documentClass?: FoundryFolderClass };
  };
}

interface SluggableString {
  slugify?(options: { strict: boolean }): string;
}

function scope(): ManagementGlobalScope {
  return globalThis as unknown as ManagementGlobalScope;
}

export const defaultPackManagementGameProvider: PackManagementGameProvider = {
  getGame: () => scope().game
};

// Foundry 13 moved CompendiumCollection into `foundry.documents.collections`
// and left a deprecated global behind; 11 / 12 have only the global.
export function createPackManagementGlobals(
  generation: () => number = foundryGeneration
): PackManagementGlobals {
  return {
    compendiumCollectionClass: () =>
      generation() >= 13
        ? scope().foundry?.documents?.collections?.CompendiumCollection
        : scope().CompendiumCollection,
    compendiumDocumentTypes: () => scope().CONST?.COMPENDIUM_DOCUMENT_TYPES ?? [],
    slugify: (label: string) => (label as unknown as SluggableString).slugify?.({ strict: true }) ?? label,
    adventureClass: () => scope().CONFIG?.Adventure?.documentClass,
    folderClass: () => scope().CONFIG?.Folder?.documentClass
  };
}
