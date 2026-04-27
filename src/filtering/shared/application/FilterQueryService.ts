import type {
  FilterableRepository,
  PaginatedQueryResult,
} from '@/filtering/shared/domain/repository';
import type { ISpecification } from '@/filtering/shared/domain/specification';
import type { PaginationParams } from '@/filtering/shared/domain/value-objects';

export async function executeFilterQuery<TItem>(args: {
  repository: FilterableRepository<TItem>;
  specification: ISpecification<TItem>;
  comparator: (a: TItem, b: TItem) => number;
  pagination: PaginationParams;
}): Promise<PaginatedQueryResult<TItem>> {
  const { repository, specification, comparator, pagination } = args;

  const all = await repository.findAll();
  const matched = all.filter((item) => specification.isSatisfiedBy(item));
  const sorted = [...matched].sort(comparator);
  const { page, total, hasMore } = pagination.apply(sorted);

  return { items: page, total, hasMore };
}
