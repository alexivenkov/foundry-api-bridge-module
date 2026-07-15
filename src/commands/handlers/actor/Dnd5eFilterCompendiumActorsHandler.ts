import type {
  FilterCompendiumActorsParams,
  FilterCompendiumActorsResult
} from '@/commands/types';
import { requireSystem } from '@/systems';
import { formatZodError } from '@/kernel';
import { createFilterCompendiumActorsService } from '@/filtering/actors/application';
import {
  CompendiumActorRepository,
  FoundryActorMapper,
  defaultCompendiumFilteringGameProvider,
  type CompendiumFilteringGameProvider
} from '@/filtering/actors/infrastructure';
import {
  CompendiumRequestToQueryMapper,
  filterCompendiumActorsRequestSchema
} from '@/filtering/actors/validation';

export interface Dnd5eFilterCompendiumActorsHandlerDependencies {
  gameProvider?: CompendiumFilteringGameProvider;
}

export function createDnd5eFilterCompendiumActorsHandler(
  deps: Dnd5eFilterCompendiumActorsHandlerDependencies = {}
): (params: FilterCompendiumActorsParams) => Promise<FilterCompendiumActorsResult> {
  const gameProvider = deps.gameProvider ?? defaultCompendiumFilteringGameProvider;

  return async function dnd5eFilterCompendiumActorsHandler(
    params: FilterCompendiumActorsParams
  ): Promise<FilterCompendiumActorsResult> {
    requireSystem('dnd5e', 'dnd5e/filter-compendium-actors');

    const parsed = filterCompendiumActorsRequestSchema.safeParse(params);
    if (!parsed.success) {
      throw new Error(formatZodError(parsed.error));
    }

    const query = CompendiumRequestToQueryMapper.toQuery(parsed.data);
    const repository = new CompendiumActorRepository(
      gameProvider,
      new FoundryActorMapper(),
      parsed.data.packIds
    );
    const service = createFilterCompendiumActorsService({ repository });

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

export const dnd5eFilterCompendiumActorsHandler = createDnd5eFilterCompendiumActorsHandler();
