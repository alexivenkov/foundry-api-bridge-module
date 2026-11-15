import { DomainError } from '@/kernel';

export class TileCreationFailedError extends DomainError {
  constructor() {
    super('Failed to create tile');
    this.name = 'TileCreationFailedError';
    Object.setPrototypeOf(this, TileCreationFailedError.prototype);
  }
}
