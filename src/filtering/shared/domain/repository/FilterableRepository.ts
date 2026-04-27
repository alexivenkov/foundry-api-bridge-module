export interface FilterableRepository<T> {
  findAll(): Promise<readonly T[]>;
}
