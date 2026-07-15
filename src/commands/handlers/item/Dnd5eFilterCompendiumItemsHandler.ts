import type {
  FilterCompendiumItemsParams,
  FilterCompendiumItemsResult
} from '@/commands/types';
import { requireSystem } from '@/systems';
import { formatZodError } from '@/kernel';
import { createFilterCompendiumItemsService } from '@/filtering/items/application';
import {
  CompendiumItemRepository,
  FoundryItemMapper,
  defaultCompendiumItemFilteringGameProvider,
  type CompendiumItemFilteringGameProvider
} from '@/filtering/items/infrastructure';
import {
  CompendiumRequestToQueryMapper,
  filterCompendiumItemsRequestSchema
} from '@/filtering/items/validation';

export interface Dnd5eFilterCompendiumItemsHandlerDependencies {
  gameProvider?: CompendiumItemFilteringGameProvider;
}

export function createDnd5eFilterCompendiumItemsHandler(
  deps: Dnd5eFilterCompendiumItemsHandlerDependencies = {}
): (params: FilterCompendiumItemsParams) => Promise<FilterCompendiumItemsResult> {
  const gameProvider = deps.gameProvider ?? defaultCompendiumItemFilteringGameProvider;

  return async function dnd5eFilterCompendiumItemsHandler(
    params: FilterCompendiumItemsParams
  ): Promise<FilterCompendiumItemsResult> {
    requireSystem('dnd5e', 'dnd5e/filter-compendium-items');

    const parsed = filterCompendiumItemsRequestSchema.safeParse(params);
    if (!parsed.success) {
      throw new Error(formatZodError(parsed.error));
    }

    const query = CompendiumRequestToQueryMapper.toQuery(parsed.data);
    const repository = new CompendiumItemRepository(
      gameProvider,
      new FoundryItemMapper(),
      parsed.data.packIds
    );
    const service = createFilterCompendiumItemsService({ repository });

    const result = await service.execute(query);
    return {
      results: result.results.map(entry => ({
        id: entry.id,
        name: entry.name,
        packId: entry.packId,
        uuid: entry.uuid
      })),
      total: result.total,
      hasMore: result.hasMore
    };
  };
}

export const dnd5eFilterCompendiumItemsHandler = createDnd5eFilterCompendiumItemsHandler();
