import { DomainError } from '@/kernel';

export class PackAlreadyExistsError extends DomainError {
  constructor(public readonly packId: string) {
    super(`Compendium pack already exists: ${packId}`);
    this.name = 'PackAlreadyExistsError';
    Object.setPrototypeOf(this, PackAlreadyExistsError.prototype);
  }
}
