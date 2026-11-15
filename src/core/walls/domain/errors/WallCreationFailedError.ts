import { DomainError } from '@/kernel';

export class WallCreationFailedError extends DomainError {
  constructor() {
    super('Wall creation returned no document');
    this.name = 'WallCreationFailedError';
    Object.setPrototypeOf(this, WallCreationFailedError.prototype);
  }
}
