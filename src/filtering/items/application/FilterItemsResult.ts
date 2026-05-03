export interface FilterItemsResultEntry {
  readonly id: string;
  readonly name: string;
}

export interface FilterItemsResult {
  readonly results: readonly FilterItemsResultEntry[];
  readonly total: number;
  readonly hasMore: boolean;
}
