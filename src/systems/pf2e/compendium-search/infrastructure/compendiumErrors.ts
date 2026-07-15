import { DomainError } from '@/kernel';

// Wire texts intentionally match the other compendium features' flavors so
// clients see one vocabulary for pack resolution problems.

export class Pf2eCompendiumPackNotFoundError extends DomainError {
  constructor(public readonly packId: string) {
    super(`Pack not found: ${packId}`);
    this.name = 'Pf2eCompendiumPackNotFoundError';
    Object.setPrototypeOf(this, Pf2eCompendiumPackNotFoundError.prototype);
  }
}

export class Pf2eCompendiumPackTypeError extends DomainError {
  constructor(
    public readonly packId: string,
    public readonly expectedType: string
  ) {
    super(`Compendium pack is not an ${expectedType} pack: ${packId}`);
    this.name = 'Pf2eCompendiumPackTypeError';
    Object.setPrototypeOf(this, Pf2eCompendiumPackTypeError.prototype);
  }
}
