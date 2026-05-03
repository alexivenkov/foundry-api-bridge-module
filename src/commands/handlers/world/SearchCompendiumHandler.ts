import type {
  SearchCompendiumParams,
  SearchCompendiumResult,
  CompendiumIndexEntry,
  CompendiumFilter
} from '@/commands/types';
import { mapIndexEntryToCommand, type RawIndexEntry } from './compendiumMappers';
import {
  getCompendiumGame,
  type CompendiumPackFull,
  type SearchFieldFilter,
  type SearchOptions
} from './compendiumPackTypes';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 500;

export async function searchCompendiumHandler(
  params: SearchCompendiumParams
): Promise<SearchCompendiumResult> {
  const game = getCompendiumGame();
  const pack = game.packs?.get(params.packId);

  if (!pack) {
    throw new Error(`Pack not found: ${params.packId}`);
  }

  if (params.fields !== undefined && params.fields.length > 0) {
    await pack.getIndex({ fields: params.fields });
  }

  const searchOptions = buildSearchOptions(params);
  const rawSearchResult = pack.search(searchOptions);
  const matched: RawIndexEntry[] = normalizeSearchResults(pack, rawSearchResult);

  const total = matched.length;
  const limit = clampLimit(params.limit);
  const offset = params.offset !== undefined && params.offset >= 0 ? params.offset : 0;
  const page = matched.slice(offset, offset + limit);

  const results: CompendiumIndexEntry[] = page.map(entry =>
    mapIndexEntryToCommand(entry, params.fields)
  );

  return {
    packId: params.packId,
    results,
    total,
    hasMore: offset + page.length < total
  };
}

function buildSearchOptions(params: SearchCompendiumParams): SearchOptions {
  const options: SearchOptions = {};
  if (params.query !== undefined) {
    options.query = params.query;
  }
  if (params.filters !== undefined) {
    options.filters = params.filters.map(toFoundryFilter);
  }
  if (params.exclude !== undefined) {
    options.exclude = params.exclude;
  }
  return options;
}

function toFoundryFilter(filter: CompendiumFilter): SearchFieldFilter {
  return {
    field: filter.field,
    operator: filter.operator ?? 'EQUALS',
    value: filter.value,
    negate: filter.negate ?? false
  };
}

function normalizeSearchResults(
  pack: CompendiumPackFull,
  result: Set<string> | RawIndexEntry[]
): RawIndexEntry[] {
  if (result instanceof Set) {
    const entries: RawIndexEntry[] = [];
    for (const id of result) {
      const entry = pack.index.get(id);
      if (entry !== undefined) {
        entries.push(entry);
      }
    }
    return entries;
  }
  return result;
}

function clampLimit(requested: number | undefined): number {
  if (requested === undefined || requested < 1) return DEFAULT_LIMIT;
  if (requested > MAX_LIMIT) return MAX_LIMIT;
  return requested;
}
