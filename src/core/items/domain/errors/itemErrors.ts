import { DomainError } from '@/kernel';

export class ItemNotFoundError extends DomainError {
  constructor(public readonly itemId: string) {
    super(`Item not found: ${itemId}`);
    this.name = 'ItemNotFoundError';
    Object.setPrototypeOf(this, ItemNotFoundError.prototype);
  }
}

export class ItemCreationCancelledError extends DomainError {
  constructor() {
    super('Item creation was cancelled by Foundry (a module hook may have vetoed it)');
    this.name = 'ItemCreationCancelledError';
    Object.setPrototypeOf(this, ItemCreationCancelledError.prototype);
  }
}

export class OwnedItemCreationFailedError extends DomainError {
  constructor() {
    super('Failed to create item');
    this.name = 'OwnedItemCreationFailedError';
    Object.setPrototypeOf(this, OwnedItemCreationFailedError.prototype);
  }
}

export class OwnedItemUpdateFailedError extends DomainError {
  constructor() {
    super('Failed to update item');
    this.name = 'OwnedItemUpdateFailedError';
    Object.setPrototypeOf(this, OwnedItemUpdateFailedError.prototype);
  }
}
