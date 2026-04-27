import { CompositeSpecification } from './CompositeSpecification';
import { registerAndFactory } from './compose';
import type { ISpecification } from './Specification';

export class AndSpecification<T> extends CompositeSpecification<T> {
  constructor(
    private readonly left: ISpecification<T>,
    private readonly right: ISpecification<T>
  ) {
    super();
  }

  override isSatisfiedBy(candidate: T): boolean {
    return this.left.isSatisfiedBy(candidate) && this.right.isSatisfiedBy(candidate);
  }
}

registerAndFactory(<T>(left: ISpecification<T>, right: ISpecification<T>): ISpecification<T> => {
  return new AndSpecification<T>(left, right);
});
