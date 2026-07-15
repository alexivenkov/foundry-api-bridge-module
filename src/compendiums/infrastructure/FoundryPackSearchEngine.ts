import { PackNotFoundError } from '@/compendiums/domain';
import type { PackIndexEntry, PackSearchCriteria, PackSearchEngine } from '@/compendiums/domain';
import type { CompendiumGameProvider } from './foundryGameProvider';
import type {
  FoundryPack,
  FoundrySearchOptions,
  RawIndexEntry
} from './foundryPackTypes';
import { toPackIndexEntry } from './indexEntryMapper';
import { toFoundryOperator } from './operatorMapping';

export class FoundryPackSearchEngine implements PackSearchEngine {
  constructor(private readonly gameProvider: CompendiumGameProvider) {}

  async searchIndex(
    packId: string,
    criteria: PackSearchCriteria
  ): Promise<readonly PackIndexEntry[]> {
    const pack = this.gameProvider.getGame().packs?.get(packId);
    if (!pack) {
      throw new PackNotFoundError(packId);
    }

    if (criteria.fields !== undefined && criteria.fields.length > 0) {
      await pack.getIndex({ fields: [...criteria.fields] });
    }

    const rawResult = pack.search(buildSearchOptions(criteria));
    const matched = normalizeSearchResults(pack, rawResult);
    return matched.map(entry => toPackIndexEntry(entry, criteria.fields));
  }
}

function buildSearchOptions(criteria: PackSearchCriteria): FoundrySearchOptions {
  const options: FoundrySearchOptions = {};
  if (criteria.query !== undefined) {
    options.query = criteria.query;
  }
  if (criteria.filters !== undefined) {
    options.filters = criteria.filters.map(filter => ({
      field: filter.field,
      operator: toFoundryOperator(filter.operator),
      value: filter.value,
      negate: filter.negate
    }));
  }
  if (criteria.exclude !== undefined) {
    options.exclude = [...criteria.exclude];
  }
  return options;
}

function normalizeSearchResults(
  pack: FoundryPack,
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
