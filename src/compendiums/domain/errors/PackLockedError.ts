import { DomainError } from '@/kernel';

export class PackLockedError extends DomainError {
  constructor(public readonly packId: string) {
    super(`Compendium pack is locked: ${packId}; unlock it with configure-compendium first`);
    this.name = 'PackLockedError';
    Object.setPrototypeOf(this, PackLockedError.prototype);
  }
}
