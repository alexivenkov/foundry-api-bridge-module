import { DomainError } from '@/kernel';

export class PackNotFoundError extends DomainError {
  constructor(public readonly packId: string) {
    super(`Pack not found: ${packId}`);
    this.name = 'PackNotFoundError';
    Object.setPrototypeOf(this, PackNotFoundError.prototype);
  }
}
