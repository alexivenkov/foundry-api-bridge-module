import type { PackIndexEntry, PackIndexScanner, ScannablePack } from '@/compendiums/domain';
import type { CompendiumGameProvider } from './foundryGameProvider';
import type { FoundryPack } from './foundryPackTypes';
import { collectRawEntries } from './FoundryPackIndexReader';
import { toPackIndexEntry } from './indexEntryMapper';

export class FoundryPackIndexScanner implements PackIndexScanner {
  constructor(private readonly gameProvider: CompendiumGameProvider) {}

  scanPacks(): readonly ScannablePack[] {
    const packs = this.gameProvider.getGame().packs;
    if (!packs) {
      return [];
    }

    // forEach cannot await, and getIndex() is async — enumerate packs first,
    // let the caller pull each index lazily.
    const collected: FoundryPack[] = [];
    packs.forEach(pack => {
      collected.push(pack);
    });

    return collected.map((pack): ScannablePack => ({
      descriptor: {
        id: pack.collection,
        label: pack.metadata.label,
        type: pack.metadata.type,
        system: pack.metadata.system ?? ''
      },
      readEntries: async (): Promise<readonly PackIndexEntry[]> => {
        const index = await pack.getIndex();
        return collectRawEntries(index).map(entry => toPackIndexEntry(entry));
      }
    }));
  }
}
