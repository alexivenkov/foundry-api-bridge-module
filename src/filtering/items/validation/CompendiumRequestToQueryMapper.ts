import { EnumSet, PaginationParams, Range, SubstringQuery } from '@/kernel';
import {
  parseItemRarity,
  parseItemType,
  parseSpellSchool,
  type ItemRarity,
  type ItemType,
  type SpellSchool
} from '@/filtering/items/domain/value-objects';
import type { FilterCompendiumItemsQuery } from '@/filtering/items/application';
import type { FilterCompendiumItemsRequest } from './FilterCompendiumItemsRequestSchema';

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

function mapPagination(request: FilterCompendiumItemsRequest): PaginationParams {
  return new PaginationParams(
    request.limit ?? PaginationParams.DEFAULT_LIMIT,
    request.offset ?? PaginationParams.DEFAULT_OFFSET
  );
}

// packIds are intentionally not part of the query object — they parameterize
// the repository, not the specification.
function toQuery(request: FilterCompendiumItemsRequest): FilterCompendiumItemsQuery {
  const result: Mutable<FilterCompendiumItemsQuery> = {
    pagination: mapPagination(request)
  };

  if (request.name !== undefined) {
    result.name = new SubstringQuery(request.name);
  }
  if (request.type !== undefined) {
    result.types = new EnumSet<ItemType>(request.type.map(parseItemType));
  }
  if (request.rarity !== undefined) {
    result.rarities = new EnumSet<ItemRarity>(request.rarity.map(parseItemRarity));
  }
  if (request.spellSchool !== undefined) {
    result.spellSchools = new EnumSet<SpellSchool>(
      request.spellSchool.map(parseSpellSchool)
    );
  }
  if (request.requiresAttunement !== undefined) {
    result.requiresAttunement = request.requiresAttunement;
  }
  if (request.identified !== undefined) {
    result.identified = request.identified;
  }
  if (request.hasActivities !== undefined) {
    result.hasActivities = request.hasActivities;
  }
  if (request.isContainer !== undefined) {
    result.isContainer = request.isContainer;
  }
  if (request.weight !== undefined) {
    result.weight = new Range(request.weight.min, request.weight.max);
  }
  if (request.price !== undefined) {
    result.price = new Range(request.price.min, request.price.max);
  }
  if (request.spellLevel !== undefined) {
    result.spellLevel = new Range(request.spellLevel.min, request.spellLevel.max);
  }
  return result;
}

export const CompendiumRequestToQueryMapper = Object.freeze({
  toQuery
});
