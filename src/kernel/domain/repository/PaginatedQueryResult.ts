export interface PaginatedQueryResult<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly hasMore: boolean;
}
