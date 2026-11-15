import { DomainError } from '@/kernel';

export class DrawingAuthorNotFoundError extends DomainError {
  constructor(public readonly userId: string) {
    super(`User not found: ${userId}`);
    this.name = 'DrawingAuthorNotFoundError';
    Object.setPrototypeOf(this, DrawingAuthorNotFoundError.prototype);
  }
}
