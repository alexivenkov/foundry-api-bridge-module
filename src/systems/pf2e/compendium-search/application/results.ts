// Entries carry `level` (the primary content-selection axis in pf2e) in
// addition to the cross-pack address (packId + uuid).
export interface Pf2eCompendiumSearchEntry {
  readonly id: string;
  readonly name: string;
  readonly level: number | null;
  readonly packId: string;
  readonly uuid: string;
}

export interface Pf2eCompendiumSearchResult {
  readonly results: readonly Pf2eCompendiumSearchEntry[];
  readonly total: number;
  readonly hasMore: boolean;
}
