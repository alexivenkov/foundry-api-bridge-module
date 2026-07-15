import { PackNotFoundError } from '@/compendiums/domain';
import type { PackIndexEntry, PackIndexReader } from '@/compendiums/domain';
import type { CompendiumGameProvider } from './foundryGameProvider';
import type { FoundryPackIndex, RawIndexEntry } from './foundryPackTypes';
import { toPackIndexEntry } from './indexEntryMapper';

export class FoundryPackIndexReader implements PackIndexReader {
  constructor(private readonly gameProvider: CompendiumGameProvider) {}

  async readIndex(
    packId: string,
    fields?: readonly string[]
  ): Promise<readonly PackIndexEntry[]> {
    const pack = this.gameProvider.getGame().packs?.get(packId);
    if (!pack) {
      throw new PackNotFoundError(packId);
    }

    const indexOptions: { fields?: string[] } = {};
    if (fields !== undefined && fields.length > 0) {
      indexOptions.fields = [...fields];
    }

    const indexCollection = await pack.getIndex(indexOptions);
    const rawEntries = collectRawEntries(indexCollection);
    return rawEntries.map(entry => toPackIndexEntry(entry, fields));
  }
}

export function collectRawEntries(index: FoundryPackIndex): RawIndexEntry[] {
  if (index.contents !== undefined) {
    return index.contents;
  }
  const list: RawIndexEntry[] = [];
  index.forEach(entry => list.push(entry));
  return list;
}
