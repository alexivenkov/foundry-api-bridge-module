import { EnumSet, PaginationParams, Range, SubstringQuery } from '@/kernel';
import {
  ABILITY_KEYS,
  parseActorType,
  parseCreatureType,
  parseDisposition,
  parseSize,
  type ActorType,
  type CreatureType,
  type Disposition,
  type Size
} from '@/filtering/actors/domain/value-objects';
import type { AbilityRangeMap } from '@/filtering/actors/domain/specifications';
import type { FilterCompendiumActorsQuery } from '@/filtering/actors/application';
import type { FilterCompendiumActorsRequest } from './FilterCompendiumActorsRequestSchema';

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

function mapPagination(request: FilterCompendiumActorsRequest): PaginationParams {
  return new PaginationParams(
    request.limit ?? PaginationParams.DEFAULT_LIMIT,
    request.offset ?? PaginationParams.DEFAULT_OFFSET
  );
}

function mapAbilities(
  abilities: NonNullable<FilterCompendiumActorsRequest['abilities']>
): AbilityRangeMap {
  const result: Mutable<AbilityRangeMap> = {};
  for (const key of ABILITY_KEYS) {
    const ability = abilities[key];
    if (ability !== undefined) {
      result[key] = new Range(ability.min, ability.max);
    }
  }
  return result;
}

// packIds are intentionally not part of the query object — they parameterize
// the repository, not the specification.
function toQuery(request: FilterCompendiumActorsRequest): FilterCompendiumActorsQuery {
  const result: Mutable<FilterCompendiumActorsQuery> = {
    pagination: mapPagination(request)
  };

  if (request.name !== undefined) {
    result.name = new SubstringQuery(request.name);
  }
  if (request.type !== undefined) {
    result.types = new EnumSet<ActorType>(request.type.map(parseActorType));
  }
  if (request.creatureType !== undefined) {
    result.creatureTypes = new EnumSet<CreatureType>(
      request.creatureType.map(parseCreatureType)
    );
  }
  if (request.size !== undefined) {
    result.sizes = new EnumSet<Size>(request.size.map(parseSize));
  }
  if (request.disposition !== undefined) {
    result.dispositions = new EnumSet<Disposition>(
      request.disposition.map(parseDisposition)
    );
  }
  if (request.cr !== undefined) {
    result.cr = new Range(request.cr.min, request.cr.max);
  }
  if (request.level !== undefined) {
    result.level = new Range(request.level.min, request.level.max);
  }
  if (request.maxHp !== undefined) {
    result.maxHp = new Range(request.maxHp.min, request.maxHp.max);
  }
  if (request.ac !== undefined) {
    result.ac = new Range(request.ac.min, request.ac.max);
  }
  if (request.abilities !== undefined) {
    result.abilities = mapAbilities(request.abilities);
  }
  return result;
}

export const CompendiumRequestToQueryMapper = Object.freeze({
  toQuery
});
