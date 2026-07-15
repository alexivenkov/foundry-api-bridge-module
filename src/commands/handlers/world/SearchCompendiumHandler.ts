import type { SearchCompendiumParams, SearchCompendiumResult } from '@/commands/types';
import {
  createFoundryCompendiumQueryService,
  searchCompendiumRequestSchema,
  toSearchInPackQuery,
  type CompendiumGameProvider
} from '@/compendiums';
import { formatZodError } from '@/kernel';
import { toWireIndexEntry } from './compendiumWireMappers';

export interface SearchCompendiumHandlerDependencies {
  gameProvider?: CompendiumGameProvider;
}

export function createSearchCompendiumHandler(
  deps: SearchCompendiumHandlerDependencies = {}
): (params: SearchCompendiumParams) => Promise<SearchCompendiumResult> {
  const service = createFoundryCompendiumQueryService(deps.gameProvider);

  return async function searchCompendiumHandler(
    params: SearchCompendiumParams
  ): Promise<SearchCompendiumResult> {
    const parsed = searchCompendiumRequestSchema.safeParse(params);
    if (!parsed.success) {
      throw new Error(formatZodError(parsed.error));
    }

    const result = await service.searchInPack(toSearchInPackQuery(parsed.data));
    return {
      packId: result.packId,
      results: result.results.map(toWireIndexEntry),
      total: result.total,
      hasMore: result.hasMore
    };
  };
}

export const searchCompendiumHandler = createSearchCompendiumHandler();
