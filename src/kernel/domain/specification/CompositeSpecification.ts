import type { ISpecification } from './Specification';

export abstract class CompositeSpecification<T> implements ISpecification<T> {
  abstract isSatisfiedBy(candidate: T): boolean;

  and(other: ISpecification<T>): ISpecification<T> {
    return new AndSpecification<T>(this, other);
  }

  or(other: ISpecification<T>): ISpecification<T> {
    return new OrSpecification<T>(this, other);
  }

  not(): ISpecification<T> {
    return new NotSpecification<T>(this);
  }
}

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

export class NotSpecification<T> extends CompositeSpecification<T> {
  constructor(private readonly inner: ISpecification<T>) {
    super();
  }

  override isSatisfiedBy(candidate: T): boolean {
    return !this.inner.isSatisfiedBy(candidate);
  }
}

export class AlwaysTrueSpecification<T> extends CompositeSpecification<T> {
  override isSatisfiedBy(_candidate: T): boolean {
    return true;
  }
}

export class AlwaysFalseSpecification<T> extends CompositeSpecification<T> {
  override isSatisfiedBy(_candidate: T): boolean {
    return false;
  }
}
