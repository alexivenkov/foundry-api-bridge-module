import { DomainError } from '@/kernel';

export class HotbarUserNotFoundError extends DomainError {
  constructor(public readonly userId: string) {
    super(`User not found: ${userId}`);
    this.name = 'HotbarUserNotFoundError';
    Object.setPrototypeOf(this, HotbarUserNotFoundError.prototype);
  }
}

export class CurrentUserUnknownError extends DomainError {
  constructor() {
    super('The current user is not known yet');
    this.name = 'CurrentUserUnknownError';
    Object.setPrototypeOf(this, CurrentUserUnknownError.prototype);
  }
}

export class HotbarSlotEmptyError extends DomainError {
  constructor(public readonly slot: number) {
    super(`Hotbar slot ${String(slot)} is empty`);
    this.name = 'HotbarSlotEmptyError';
    Object.setPrototypeOf(this, HotbarSlotEmptyError.prototype);
  }
}

export class HotbarFullError extends DomainError {
  constructor() {
    super('No free hotbar slot');
    this.name = 'HotbarFullError';
    Object.setPrototypeOf(this, HotbarFullError.prototype);
  }
}
