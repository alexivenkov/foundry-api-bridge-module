import { ValidationError } from '../errors/ValidationError';

export class Range {
  constructor(
    public readonly min: number | undefined,
    public readonly max: number | undefined
  ) {
    if (min === undefined && max === undefined) {
      throw new ValidationError('Range must have at least one bound defined');
    }
    if (min !== undefined && !Number.isFinite(min)) {
      throw new ValidationError('Range min must be a finite number');
    }
    if (max !== undefined && !Number.isFinite(max)) {
      throw new ValidationError('Range max must be a finite number');
    }
    if (min !== undefined && max !== undefined && min > max) {
      throw new ValidationError('Range min must be <= max');
    }
  }

  contains(value: number): boolean {
    if (this.min !== undefined && value < this.min) {
      return false;
    }
    if (this.max !== undefined && value > this.max) {
      return false;
    }
    return true;
  }

  toString(): string {
    const minStr = this.min !== undefined ? String(this.min) : '';
    const maxStr = this.max !== undefined ? String(this.max) : '';
    return `[${minStr}..${maxStr}]`;
  }
}
