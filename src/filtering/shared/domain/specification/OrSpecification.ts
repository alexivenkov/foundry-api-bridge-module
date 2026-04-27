import { CompositeSpecification } from './CompositeSpecification';
import { registerOrFactory } from './compose';
import type { ISpecification } from './Specification';

export class OrSpecification<T> extends CompositeSpecification<T> {
  constructor(
    private readonly left: ISpecification<T>,
    private readonly right: ISpecification<T>
  ) {
    super();
  }

  override isSatisfiedBy(candidate: T): boolean {
    return this.left.isSatisfiedBy(candidate) || this.right.isSatisfiedBy(candidate);
  }
}

registerOrFactory(<T>(left: ISpecification<T>, right: ISpecification<T>): ISpecification<T> => {
  return new OrSpecification<T>(left, right);
});
