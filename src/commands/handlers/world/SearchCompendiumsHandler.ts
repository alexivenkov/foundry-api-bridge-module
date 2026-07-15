import type { CompendiumSearchMatch, SearchCompendiumsParams } from '@/commands/types';
import {
  createFoundryCompendiumQueryService,
  searchCompendiumsRequestSchema,
  toSearchAcrossPacksQuery,
  type CompendiumGameProvider
} from '@/compendiums';
import { formatZodError } from '@/kernel';

export interface SearchCompendiumsHandlerDependencies {
  gameProvider?: CompendiumGameProvider;
}

export function createSearchCompendiumsHandler(
  deps: SearchCompendiumsHandlerDependencies = {}
): (params: SearchCompendiumsParams) => Promise<CompendiumSearchMatch[]> {
  const service = createFoundryCompendiumQueryService(deps.gameProvider);

  return async function searchCompendiumsHandler(
    params: SearchCompendiumsParams
  ): Promise<CompendiumSearchMatch[]> {
    const parsed = searchCompendiumsRequestSchema.safeParse(params);
    if (!parsed.success) {
      throw new Error(formatZodError(parsed.error));
    }

    const matches = await service.searchAcrossPacks(toSearchAcrossPacksQuery(parsed.data));
    return matches.map(match => {
      const wireMatch: CompendiumSearchMatch = {
        packId: match.packId,
        packLabel: match.packLabel,
        packType: match.packType,
        system: match.system,
        id: match.id,
        name: match.name
      };
      if (match.documentType !== undefined) {
        wireMatch.documentType = match.documentType;
      }
      return wireMatch;
    });
  };
}

export const searchCompendiumsHandler = createSearchCompendiumsHandler();
