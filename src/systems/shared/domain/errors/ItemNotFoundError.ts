import { DomainError } from './DomainError';

export class ItemNotFoundError extends DomainError {
  constructor(itemId: string) {
    super(`Item not found: ${itemId}`);
    this.name = 'ItemNotFoundError';
    Object.setPrototypeOf(this, ItemNotFoundError.prototype);
  }
}
