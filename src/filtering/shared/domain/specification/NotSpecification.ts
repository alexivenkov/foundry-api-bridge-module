import { CompositeSpecification } from './CompositeSpecification';
import { registerNotFactory } from './compose';
import type { ISpecification } from './Specification';

export class NotSpecification<T> extends CompositeSpecification<T> {
  constructor(private readonly inner: ISpecification<T>) {
    super();
  }

  override isSatisfiedBy(candidate: T): boolean {
    return !this.inner.isSatisfiedBy(candidate);
  }
}

registerNotFactory(<T>(inner: ISpecification<T>): ISpecification<T> => {
  return new NotSpecification<T>(inner);
});
