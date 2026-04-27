import { CompositeSpecification } from './CompositeSpecification';

export class AlwaysFalseSpecification<T> extends CompositeSpecification<T> {
  override isSatisfiedBy(_candidate: T): boolean {
    return false;
  }
}
