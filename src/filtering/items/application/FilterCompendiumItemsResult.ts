export interface FilterCompendiumItemsResultEntry {
  readonly id: string;
  readonly name: string;
  readonly packId: string;
  readonly uuid: string;
}

export interface FilterCompendiumItemsResult {
  readonly results: readonly FilterCompendiumItemsResultEntry[];
  readonly total: number;
  readonly hasMore: boolean;
}
