import {
  EnumSet,
  FolderReference,
  PaginationParams,
  Range,
  SubstringQuery
} from '@/filtering/shared/domain/value-objects';
import {
  parseItemRarity,
  parseItemType,
  parseSpellSchool,
  type ItemRarity,
  type ItemType,
  type SpellSchool
} from '@/filtering/items/domain/value-objects';
import type { FilterItemsQuery } from '@/filtering/items/application';
import type { FilterItemsRequest } from './FilterItemsRequestSchema';

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

function mapPagination(request: FilterItemsRequest): PaginationParams {
  return new PaginationParams(
    request.limit ?? PaginationParams.DEFAULT_LIMIT,
    request.offset ?? PaginationParams.DEFAULT_OFFSET
  );
}

function toQuery(request: FilterItemsRequest): FilterItemsQuery {
  const result: Mutable<FilterItemsQuery> = {
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
