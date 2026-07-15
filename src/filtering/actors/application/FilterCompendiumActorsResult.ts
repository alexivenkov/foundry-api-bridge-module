export interface FilterCompendiumActorsResultEntry {
  readonly id: string;
  readonly name: string;
  readonly packId: string;
  readonly uuid: string;
}

export interface FilterCompendiumActorsResult {
  readonly results: readonly FilterCompendiumActorsResultEntry[];
  readonly total: number;
  readonly hasMore: boolean;
}
