import { ValidationError } from '../errors/ValidationError';

export class PaginationParams {
  static readonly DEFAULT_LIMIT = 50;
  static readonly MIN_LIMIT = 1;
  static readonly MAX_LIMIT = 200;
  static readonly DEFAULT_OFFSET = 0;

  constructor(
    public readonly limit: number,
    public readonly offset: number
  ) {
    if (!Number.isInteger(limit)) {
      throw new ValidationError('PaginationParams.limit must be an integer');
    }
    if (limit < PaginationParams.MIN_LIMIT || limit > PaginationParams.MAX_LIMIT) {
      throw new ValidationError(
        `PaginationParams.limit must be in [${String(PaginationParams.MIN_LIMIT)}, ${String(PaginationParams.MAX_LIMIT)}]`
      );
    }
    if (!Number.isInteger(offset)) {
      throw new ValidationError('PaginationParams.offset must be an integer');
    }
    if (offset < 0) {
      throw new ValidationError('PaginationParams.offset must be >= 0');
    }
  }

  static default(): PaginationParams {
    return new PaginationParams(PaginationParams.DEFAULT_LIMIT, PaginationParams.DEFAULT_OFFSET);
  }

  apply<T>(items: readonly T[]): { page: T[]; total: number; hasMore: boolean } {
    const total = items.length;
    const page = items.slice(this.offset, this.offset + this.limit);
    const hasMore = total > this.offset + page.length;
    return { page, total, hasMore };
  }
}
