import type { CompendiumPageMatch, SearchCompendiumPagesParams } from '@/commands/types';
import {
  createFoundryCompendiumQueryService,
  searchCompendiumPagesRequestSchema,
  toSearchJournalPagesQuery,
  type CompendiumGameProvider
} from '@/compendiums';
import { formatZodError } from '@/kernel';

export interface SearchCompendiumPagesHandlerDependencies {
  gameProvider?: CompendiumGameProvider;
}

export function createSearchCompendiumPagesHandler(
  deps: SearchCompendiumPagesHandlerDependencies = {}
): (params: SearchCompendiumPagesParams) => Promise<CompendiumPageMatch[]> {
  const service = createFoundryCompendiumQueryService(deps.gameProvider);

  return async function searchCompendiumPagesHandler(
    params: SearchCompendiumPagesParams
  ): Promise<CompendiumPageMatch[]> {
    const parsed = searchCompendiumPagesRequestSchema.safeParse(params);
    if (!parsed.success) {
      throw new Error(formatZodError(parsed.error));
    }

    const matches = await service.searchJournalPages(toSearchJournalPagesQuery(parsed.data));
    return matches.map(match => ({
      packId: match.packId,
      packLabel: match.packLabel,
      journalId: match.journalId,
      journalName: match.journalName,
      pageId: match.pageId,
      pageName: match.pageName,
      pageType: match.pageType,
      uuid: match.uuid,
      matchedIn: match.matchedIn,
      snippet: match.snippet
    }));
  };
}

export const searchCompendiumPagesHandler = createSearchCompendiumPagesHandler();
