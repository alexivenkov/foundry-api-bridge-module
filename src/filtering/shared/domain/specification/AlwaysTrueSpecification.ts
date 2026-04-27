import { CompositeSpecification } from './CompositeSpecification';

export class AlwaysTrueSpecification<T> extends CompositeSpecification<T> {
  override isSatisfiedBy(_candidate: T): boolean {
    return true;
  }
}
