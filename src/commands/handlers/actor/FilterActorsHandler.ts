import type { FilterActorsParams, FilterActorsResult } from '@/commands/types';
import {
  createFilterActorsService,
  type FilterActorsServiceDependencies
} from '@/filtering/actors/application';
import {
  defaultFoundryGameProvider,
  FoundryActorMapper,
  FoundryActorRepository,
  FoundryFolderResolver,
  type FoundryGameProvider
} from '@/filtering/actors/infrastructure';
import { formatZodError } from '@/kernel/validation';
import {
  filterActorsRequestSchema,
  RequestToQueryMapper
} from '@/filtering/actors/validation';

export interface FilterActorsHandlerDependencies {
  gameProvider?: FoundryGameProvider;
}

export function createFilterActorsHandler(
  deps: FilterActorsHandlerDependencies = {}
): (params: FilterActorsParams) => Promise<FilterActorsResult> {
  const gameProvider = deps.gameProvider ?? defaultFoundryGameProvider;

  return async function filterActorsHandler(
    params: FilterActorsParams
  ): Promise<FilterActorsResult> {
    const parsed = filterActorsRequestSchema.safeParse(params);
    if (!parsed.success) {
      throw new Error(formatZodError(parsed.error));
    }

    const query = RequestToQueryMapper.toQuery(parsed.data);

    const mapper = new FoundryActorMapper();
    const repository = new FoundryActorRepository(gameProvider, mapper);
    const folderResolver = new FoundryFolderResolver(gameProvider);

    const serviceDeps: FilterActorsServiceDependencies = {
      repository,
      folderResolver
    };
    const service = createFilterActorsService(serviceDeps);

    const result = await service.execute(query);

    return {
      results: result.results.map((r) => ({ id: r.id, name: r.name })),
      total: result.total,
      hasMore: result.hasMore
    };
  };
}

export const filterActorsHandler = createFilterActorsHandler();
