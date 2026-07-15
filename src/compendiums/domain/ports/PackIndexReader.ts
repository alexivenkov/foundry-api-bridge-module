import type { PackIndexEntry } from '@/compendiums/domain/model';

export interface PackIndexReader {
  /**
   * Load the (lightweight) index of a pack. When `fields` is a non-empty
   * list, the index is re-requested with those extra dot-paths and each
   * returned entry carries a populated `fields` record.
   *
   * @throws PackNotFoundError when the pack is unknown
   */
  readIndex(packId: string, fields?: readonly string[]): Promise<readonly PackIndexEntry[]>;
}
