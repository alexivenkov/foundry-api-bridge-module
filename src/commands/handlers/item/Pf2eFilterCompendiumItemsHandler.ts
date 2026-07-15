import type {
  Pf2eCompendiumSearchResult,
  Pf2eFilterCompendiumItemsParams
} from '@/commands/types';
import { requireSystem } from '@/systems';
import { formatZodError } from '@/kernel';
import {
  Pf2eCompendiumItemMapper,
  Pf2eCompendiumItemRepository,
  createPf2eFilterCompendiumItemsService,
  defaultPf2eCompendiumGameProvider,
  pf2eFilterCompendiumItemsRequestSchema,
  toPf2eFilterCompendiumItemsQuery,
  type Pf2eCompendiumGameProvider
} from '@/systems/pf2e/compendium-search';

export interface Pf2eFilterCompendiumItemsHandlerDependencies {
  gameProvider?: Pf2eCompendiumGameProvider;
}

export function createPf2eFilterCompendiumItemsHandler(
  deps: Pf2eFilterCompendiumItemsHandlerDependencies = {}
): (params: Pf2eFilterCompendiumItemsParams) => Promise<Pf2eCompendiumSearchResult> {
  const gameProvider = deps.gameProvider ?? defaultPf2eCompendiumGameProvider;

  return async function pf2eFilterCompendiumItemsHandler(
    params: Pf2eFilterCompendiumItemsParams
  ): Promise<Pf2eCompendiumSearchResult> {
    requireSystem('pf2e', 'pf2e/filter-compendium-items');

    const parsed = pf2eFilterCompendiumItemsRequestSchema.safeParse(params);
    if (!parsed.success) {
      throw new Error(formatZodError(parsed.error));
    }

    const query = toPf2eFilterCompendiumItemsQuery(parsed.data);
    const repository = new Pf2eCompendiumItemRepository(
      gameProvider,
      new Pf2eCompendiumItemMapper(),
      parsed.data.packIds
    );
    const service = createPf2eFilterCompendiumItemsService({ repository });

    const result = await service.execute(query);
    return {
      results: result.results.map(entry => ({
        id: entry.id,
        name: entry.name,
        level: entry.level,
        packId: entry.packId,
        uuid: entry.uuid
      })),
      total: result.total,
      hasMore: result.hasMore
    };
  };
}

export const pf2eFilterCompendiumItemsHandler = createPf2eFilterCompendiumItemsHandler();
