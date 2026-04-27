import { andSpec, notSpec, orSpec } from './compose';
import type { ISpecification } from './Specification';

export abstract class CompositeSpecification<T> implements ISpecification<T> {
  abstract isSatisfiedBy(candidate: T): boolean;

  and(other: ISpecification<T>): ISpecification<T> {
    return andSpec<T>(this, other);
  }

  or(other: ISpecification<T>): ISpecification<T> {
    return orSpec<T>(this, other);
  }

  not(): ISpecification<T> {
    return notSpec<T>(this);
  }
}

// Side-effect imports placed AFTER class declaration to break the circular
// dependency: each composite extends CompositeSpecification, so they must load
// after this class is declared, but they need to register their factories with
// `compose.ts` so that `and/or/not` work for any subclass.
import './AndSpecification';
import './OrSpecification';
import './NotSpecification';
