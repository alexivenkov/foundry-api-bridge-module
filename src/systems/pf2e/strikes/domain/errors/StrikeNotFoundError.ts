import { DomainError } from '@/systems/shared/domain/errors';

export class StrikeNotFoundError extends DomainError {
  constructor(slug: string) {
    super(`Strike not found: ${slug}`);
    this.name = 'StrikeNotFoundError';
    Object.setPrototypeOf(this, StrikeNotFoundError.prototype);
  }
}
