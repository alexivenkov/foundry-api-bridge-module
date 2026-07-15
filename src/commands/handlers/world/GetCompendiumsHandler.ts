import type { CompendiumMetadata } from '@/types/foundry';
import type { GetCompendiumsParams } from '@/commands/types';
import {
  createFoundryCompendiumQueryService,
  type CompendiumGameProvider
} from '@/compendiums';

export interface GetCompendiumsHandlerDependencies {
  gameProvider?: CompendiumGameProvider;
}

export function createGetCompendiumsHandler(
  deps: GetCompendiumsHandlerDependencies = {}
): (params: GetCompendiumsParams) => Promise<CompendiumMetadata[]> {
  const service = createFoundryCompendiumQueryService(deps.gameProvider);

  return function getCompendiumsHandler(
    _params: GetCompendiumsParams
  ): Promise<CompendiumMetadata[]> {
    const metadata: CompendiumMetadata[] = service.listPacks().map(pack => ({
      id: pack.id,
      label: pack.label,
      type: pack.type,
      system: pack.system,
      packageName: pack.packageName,
      documentCount: pack.documentCount
    }));
    return Promise.resolve(metadata);
  };
}

export const getCompendiumsHandler = createGetCompendiumsHandler();
