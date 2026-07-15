import type {
  Pf2eCompendiumSearchResult,
  Pf2eFilterCompendiumActorsParams
} from '@/commands/types';
import { requireSystem } from '@/systems';
import { formatZodError } from '@/kernel';
import {
  Pf2eCompendiumActorMapper,
  Pf2eCompendiumActorRepository,
  createPf2eFilterCompendiumActorsService,
  defaultPf2eCompendiumGameProvider,
  pf2eFilterCompendiumActorsRequestSchema,
  toPf2eFilterCompendiumActorsQuery,
  type Pf2eCompendiumGameProvider
} from '@/systems/pf2e/compendium-search';

export interface Pf2eFilterCompendiumActorsHandlerDependencies {
  gameProvider?: Pf2eCompendiumGameProvider;
}

export function createPf2eFilterCompendiumActorsHandler(
  deps: Pf2eFilterCompendiumActorsHandlerDependencies = {}
): (params: Pf2eFilterCompendiumActorsParams) => Promise<Pf2eCompendiumSearchResult> {
  const gameProvider = deps.gameProvider ?? defaultPf2eCompendiumGameProvider;

  return async function pf2eFilterCompendiumActorsHandler(
    params: Pf2eFilterCompendiumActorsParams
  ): Promise<Pf2eCompendiumSearchResult> {
    requireSystem('pf2e', 'pf2e/filter-compendium-actors');

    const parsed = pf2eFilterCompendiumActorsRequestSchema.safeParse(params);
    if (!parsed.success) {
      throw new Error(formatZodError(parsed.error));
    }

    const query = toPf2eFilterCompendiumActorsQuery(parsed.data);
    const repository = new Pf2eCompendiumActorRepository(
      gameProvider,
      new Pf2eCompendiumActorMapper(),
      parsed.data.packIds
    );
    const service = createPf2eFilterCompendiumActorsService({ repository });

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

export const pf2eFilterCompendiumActorsHandler = createPf2eFilterCompendiumActorsHandler();
