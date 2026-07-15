import { EnumSet, PaginationParams, Range, SubstringQuery } from '@/kernel';
import type {
  Pf2eFilterCompendiumActorsQuery,
  Pf2eFilterCompendiumItemsQuery
} from '@/systems/pf2e/compendium-search/application';
import type {
  Pf2eFilterCompendiumActorsRequest,
  Pf2eFilterCompendiumItemsRequest
} from './schemas';

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

function mapPagination(request: {
  limit?: number | undefined;
  offset?: number | undefined;
}): PaginationParams {
  return new PaginationParams(
    request.limit ?? PaginationParams.DEFAULT_LIMIT,
    request.offset ?? PaginationParams.DEFAULT_OFFSET
  );
}

// packIds are intentionally not part of the query objects — they
// parameterize the repositories, not the specifications.

export function toPf2eFilterCompendiumActorsQuery(
  request: Pf2eFilterCompendiumActorsRequest
): Pf2eFilterCompendiumActorsQuery {
  const query: Mutable<Pf2eFilterCompendiumActorsQuery> = {
    pagination: mapPagination(request)
  };

  if (request.name !== undefined) {
    query.name = new SubstringQuery(request.name);
  }
  if (request.type !== undefined) {
    query.types = new EnumSet<string>(request.type);
  }
  if (request.level !== undefined) {
    query.level = new Range(request.level.min, request.level.max);
  }
  if (request.traits !== undefined) {
    query.traits = request.traits;
  }
  if (request.rarity !== undefined) {
    query.rarities = new EnumSet<string>(request.rarity);
  }
  if (request.size !== undefined) {
    query.sizes = new EnumSet<string>(request.size);
  }
  if (request.maxHp !== undefined) {
    query.maxHp = new Range(request.maxHp.min, request.maxHp.max);
  }
  if (request.ac !== undefined) {
    query.ac = new Range(request.ac.min, request.ac.max);
  }
  return query;
}

export function toPf2eFilterCompendiumItemsQuery(
  request: Pf2eFilterCompendiumItemsRequest
): Pf2eFilterCompendiumItemsQuery {
  const query: Mutable<Pf2eFilterCompendiumItemsQuery> = {
    pagination: mapPagination(request)
  };

  if (request.name !== undefined) {
    query.name = new SubstringQuery(request.name);
  }
  if (request.type !== undefined) {
    query.types = new EnumSet<string>(request.type);
  }
  if (request.level !== undefined) {
    query.level = new Range(request.level.min, request.level.max);
  }
  if (request.traits !== undefined) {
    query.traits = request.traits;
  }
  if (request.rarity !== undefined) {
    query.rarities = new EnumSet<string>(request.rarity);
  }
  if (request.category !== undefined) {
    query.categories = new EnumSet<string>(request.category);
  }
  if (request.traditions !== undefined) {
    query.traditions = new EnumSet<string>(request.traditions);
  }
  if (request.priceGold !== undefined) {
    query.priceGold = new Range(request.priceGold.min, request.priceGold.max);
  }
  return query;
}
