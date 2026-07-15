import { DomainError } from '@/kernel';

// Wire texts intentionally match the compendium context's flavors so clients
// see one vocabulary for pack resolution problems.

export class CompendiumPackNotFoundError extends DomainError {
  constructor(public readonly packId: string) {
    super(`Pack not found: ${packId}`);
    this.name = 'CompendiumPackNotFoundError';
    Object.setPrototypeOf(this, CompendiumPackNotFoundError.prototype);
  }
}

export class CompendiumPackTypeError extends DomainError {
  constructor(
    public readonly packId: string,
    public readonly expectedType: string
  ) {
    super(`Compendium pack is not an ${expectedType} pack: ${packId}`);
    this.name = 'CompendiumPackTypeError';
    Object.setPrototypeOf(this, CompendiumPackTypeError.prototype);
  }
}
