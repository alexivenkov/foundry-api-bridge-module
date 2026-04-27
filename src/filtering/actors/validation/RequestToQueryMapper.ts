import {
  EnumSet,
  PaginationParams,
  Range,
  SubstringQuery
} from '@/filtering/shared/domain/value-objects';
import {
  ABILITY_KEYS,
  FolderReference,
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
import type { FilterActorsQuery } from '@/filtering/actors/application';
import type { FilterActorsRequest } from './FilterActorsRequestSchema';

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

function mapPagination(request: FilterActorsRequest): PaginationParams {
  return new PaginationParams(
    request.limit ?? PaginationParams.DEFAULT_LIMIT,
    request.offset ?? PaginationParams.DEFAULT_OFFSET
  );
}

function mapAbilities(
  abilities: NonNullable<FilterActorsRequest['abilities']>
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

function toQuery(request: FilterActorsRequest): FilterActorsQuery {
  const result: Mutable<FilterActorsQuery> = {
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
  if (request.hasPlayerOwner !== undefined) {
    result.hasPlayerOwner = request.hasPlayerOwner;
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
  if (request.currentHp !== undefined) {
    result.currentHp = new Range(request.currentHp.min, request.currentHp.max);
  }
  if (request.ac !== undefined) {
    result.ac = new Range(request.ac.min, request.ac.max);
  }
  if (request.abilities !== undefined) {
    result.abilities = mapAbilities(request.abilities);
  }
  if (request.folder !== undefined) {
    result.folder = new FolderReference(
      request.folder.id,
      request.folder.name,
      request.folder.recursive ?? false
    );
  }
  return result;
}

export const RequestToQueryMapper = Object.freeze({
  toQuery
});
