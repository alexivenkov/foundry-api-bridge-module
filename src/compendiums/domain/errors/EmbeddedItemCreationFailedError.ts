import { DomainError } from '@/kernel';

export class EmbeddedItemCreationFailedError extends DomainError {
  constructor() {
    super('Failed to create item from compendium');
    this.name = 'EmbeddedItemCreationFailedError';
    Object.setPrototypeOf(this, EmbeddedItemCreationFailedError.prototype);
  }
}
