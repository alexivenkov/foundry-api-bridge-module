import { DomainError } from '@/kernel';

export class PackCreationFailedError extends DomainError {
  constructor(public readonly label: string) {
    super(`Failed to create compendium pack: ${label}`);
    this.name = 'PackCreationFailedError';
    Object.setPrototypeOf(this, PackCreationFailedError.prototype);
  }
}
