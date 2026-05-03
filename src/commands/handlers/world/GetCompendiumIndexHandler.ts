import type { GetCompendiumIndexParams, GetCompendiumIndexResult, CompendiumIndexEntry } from '@/commands/types';
import { mapIndexEntryToCommand, type RawIndexEntry } from './compendiumMappers';
import { getCompendiumGame } from './compendiumPackTypes';

export async function getCompendiumIndexHandler(
  params: GetCompendiumIndexParams
): Promise<GetCompendiumIndexResult> {
  const game = getCompendiumGame();
  const pack = game.packs?.get(params.packId);

  if (!pack) {
    throw new Error(`Pack not found: ${params.packId}`);
  }

  const indexOptions: { fields?: string[] } = {};
  if (params.fields !== undefined && params.fields.length > 0) {
    indexOptions.fields = params.fields;
  }

  const indexCollection = await pack.getIndex(indexOptions);
  const rawEntries: RawIndexEntry[] = indexCollection.contents !== undefined
    ? indexCollection.contents
    : collectFromForEach(indexCollection);

  const entries: CompendiumIndexEntry[] = rawEntries.map(entry =>
    mapIndexEntryToCommand(entry, params.fields)
  );

  return {
    packId: params.packId,
    packType: pack.metadata.type,
    packLabel: pack.metadata.label,
    total: entries.length,
    entries
  };
}

function collectFromForEach(idx: { forEach(fn: (entry: RawIndexEntry) => void): void }): RawIndexEntry[] {
  const list: RawIndexEntry[] = [];
  idx.forEach(entry => list.push(entry));
  return list;
}
