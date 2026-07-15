import type { PackDescriptor, PackIndexEntry } from '@/compendiums/domain/model';

export interface ScannablePack {
  readonly descriptor: PackDescriptor;
  /** Lazily load and map this pack's index; called only for packs that pass filtering. */
  readonly readEntries: () => Promise<readonly PackIndexEntry[]>;
}

// Cross-pack scanning enumerates packs without per-id lookups and loads each
// index lazily, so a capped search never touches packs beyond the limit.
export interface PackIndexScanner {
  scanPacks(): readonly ScannablePack[];
}
