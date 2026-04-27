import {
  AlwaysTrueSpecification,
  type ISpecification,
} from '@/filtering/shared/domain/specification';

export type SpecificationFactory<TQuery, TItem> = (
  query: TQuery
) => ISpecification<TItem> | null;

export class SpecificationBuilder<TQuery, TItem> {
  constructor(
    private readonly factories: readonly SpecificationFactory<TQuery, TItem>[]
  ) {}

  build(query: TQuery): ISpecification<TItem> {
    let result: ISpecification<TItem> = new AlwaysTrueSpecification<TItem>();
    for (const factory of this.factories) {
      const spec = factory(query);
      if (spec === null) {
        continue;
      }
      result = result.and(spec);
    }
    return result;
  }
}
