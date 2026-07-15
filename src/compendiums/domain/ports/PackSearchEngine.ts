import type { PackIndexEntry, PackSearchCriteria } from '@/compendiums/domain/model';

export interface PackSearchEngine {
  /**
   * Run Foundry's native index search over a single pack and return every
   * match (pagination is an application concern). When `criteria.fields` is
   * a non-empty list, matched entries carry a populated `fields` record.
   *
   * @throws PackNotFoundError when the pack is unknown
   */
  searchIndex(
    packId: string,
    criteria: PackSearchCriteria
  ): Promise<readonly PackIndexEntry[]>;
}
