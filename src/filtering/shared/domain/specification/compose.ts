import type { ISpecification } from './Specification';

type BinaryFactory = <T>(left: ISpecification<T>, right: ISpecification<T>) => ISpecification<T>;
type UnaryFactory = <T>(inner: ISpecification<T>) => ISpecification<T>;

let andFactory: BinaryFactory | null = null;
let orFactory: BinaryFactory | null = null;
let notFactory: UnaryFactory | null = null;

export function registerAndFactory(factory: BinaryFactory): void {
  andFactory = factory;
}

export function registerOrFactory(factory: BinaryFactory): void {
  orFactory = factory;
}

export function registerNotFactory(factory: UnaryFactory): void {
  notFactory = factory;
}

export function andSpec<T>(left: ISpecification<T>, right: ISpecification<T>): ISpecification<T> {
  if (!andFactory) {
    throw new Error('AndSpecification factory has not been registered');
  }
  return andFactory<T>(left, right);
}

export function orSpec<T>(left: ISpecification<T>, right: ISpecification<T>): ISpecification<T> {
  if (!orFactory) {
    throw new Error('OrSpecification factory has not been registered');
  }
  return orFactory<T>(left, right);
}

export function notSpec<T>(inner: ISpecification<T>): ISpecification<T> {
  if (!notFactory) {
    throw new Error('NotSpecification factory has not been registered');
  }
  return notFactory<T>(inner);
}
