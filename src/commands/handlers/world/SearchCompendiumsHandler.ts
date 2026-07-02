import type { SearchCompendiumsParams, CompendiumSearchMatch } from '@/commands/types';

const DEFAULT_LIMIT = 100;

interface SearchIndexEntry {
  _id?: string;
  id?: string;
  name?: string;
  type?: string | null;
}

interface SearchPackIndex {
  forEach(fn: (entry: SearchIndexEntry) => void): void;
}

interface SearchPack {
  collection: string;
  metadata: { label: string; type: string; system?: string | undefined };
  getIndex(): Promise<SearchPackIndex>;
}

interface SearchPacksCollection {
  forEach(fn: (pack: SearchPack) => void): void;
}

interface SearchCompendiumsGame {
  packs: SearchPacksCollection | undefined;
}

function getGame(): SearchCompendiumsGame {
  return (globalThis as unknown as { game: SearchCompendiumsGame }).game;
}

/**
 * Search the index of every compendium pack for documents whose name contains
 * `query` (case-insensitive). Reads only the lightweight `pack.index`
 * (via `getIndex()`) — never `getDocuments()` — and returns capped, minimal
 * records. An empty result is `[]`, never an error.
 */
export async function searchCompendiumsHandler(
  params: SearchCompendiumsParams
): Promise<CompendiumSearchMatch[]> {
  const needle = params.query.toLowerCase().trim();
  if (needle === '') {
    return [];
  }

  const limit = params.limit !== undefined && params.limit > 0 ? params.limit : DEFAULT_LIMIT;

  const game = getGame();
  if (!game.packs) {
    return [];
  }

  // forEach cannot await, and getIndex() is async — collect packs first.
  const packs: SearchPack[] = [];
  game.packs.forEach(pack => { packs.push(pack); });

  const results: CompendiumSearchMatch[] = [];

  for (const pack of packs) {
    if (params.type !== undefined && pack.metadata.type !== params.type) {
      continue;
    }
    if (params.system !== undefined && (pack.metadata.system ?? '') !== params.system) {
      continue;
    }

    const index = await pack.getIndex();
    const entries: SearchIndexEntry[] = [];
    index.forEach(entry => { entries.push(entry); });

    for (const entry of entries) {
      const name = entry.name;
      if (name === undefined || !name.toLowerCase().includes(needle)) {
        continue;
      }
      const id = entry._id ?? entry.id;
      if (id === undefined) {
        continue;
      }

      const match: CompendiumSearchMatch = {
        packId: pack.collection,
        packLabel: pack.metadata.label,
        packType: pack.metadata.type,
        system: pack.metadata.system ?? '',
        id,
        name
      };
      if (typeof entry.type === 'string' && entry.type.length > 0) {
        match.documentType = entry.type;
      }

      results.push(match);
      if (results.length >= limit) {
        return results;
      }
    }
  }

  return results;
}
