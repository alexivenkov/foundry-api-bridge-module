import type { FilterItemsParams, FilterItemsResult } from '@/commands/types';
import {
  createFilterItemsService,
  type FilterItemsServiceDependencies
} from '@/filtering/items/application';
import {
  defaultFoundryItemGameProvider,
  FoundryItemMapper,
  FoundryItemRepository,
  type FoundryItemGameProvider
} from '@/filtering/items/infrastructure';
import { FoundryFolderResolver } from '@/filtering/shared/infrastructure';
import { formatZodError } from '@/filtering/shared/validation';
import {
  filterItemsRequestSchema,
  RequestToQueryMapper
} from '@/filtering/items/validation';

const ITEM_FOLDER_TYPE = 'Item';

export interface FilterItemsHandlerDependencies {
  gameProvider?: FoundryItemGameProvider;
}

export function createFilterItemsHandler(
  deps: FilterItemsHandlerDependencies = {}
): (params: FilterItemsParams) => Promise<FilterItemsResult> {
  const gameProvider = deps.gameProvider ?? defaultFoundryItemGameProvider;

  return async function filterItemsHandler(
    params: FilterItemsParams
  ): Promise<FilterItemsResult> {
    const parsed = filterItemsRequestSchema.safeParse(params);
    if (!parsed.success) {
      throw new Error(formatZodError(parsed.error));
    }

    const query = RequestToQueryMapper.toQuery(parsed.data);

    const mapper = new FoundryItemMapper();
    const repository = new FoundryItemRepository(gameProvider, mapper);
    const folderResolver = new FoundryFolderResolver(gameProvider, ITEM_FOLDER_TYPE);

    const serviceDeps: FilterItemsServiceDependencies = {
      repository,
      folderResolver
    };
    const service = createFilterItemsService(serviceDeps);

    const result = await service.execute(query);

    return {
      results: result.results.map((r) => ({ id: r.id, name: r.name })),
      total: result.total,
      hasMore: result.hasMore
    };
  };
}

export const filterItemsHandler = createFilterItemsHandler();
