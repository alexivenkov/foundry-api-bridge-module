export interface FilterActorsResultEntry {
  readonly id: string;
  readonly name: string;
}

export interface FilterActorsResult {
  readonly results: readonly FilterActorsResultEntry[];
  readonly total: number;
  readonly hasMore: boolean;
}
