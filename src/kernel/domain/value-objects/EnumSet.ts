import { ValidationError } from '../errors/ValidationError';

export class EnumSet<T extends string> {
  private readonly values: ReadonlySet<T>;
  private readonly sorted: readonly T[];

  constructor(values: readonly T[]) {
    if (values.length === 0) {
      throw new ValidationError('EnumSet must not be empty');
    }
    const set = new Set<T>(values);
    this.values = set;
    this.sorted = Array.from(set).sort();
  }

  has(value: T): boolean {
    return this.values.has(value);
  }

  toArray(): readonly T[] {
    return this.sorted;
  }

  size(): number {
    return this.values.size;
  }
}
