import { DomainError } from '@/kernel';

export class PackNotDeletableError extends DomainError {
  constructor(public readonly packId: string, packageType: string, packageName: string) {
    super(`Only world compendium packs can be deleted; ${packId} belongs to the ${packageType} ${packageName}`);
    this.name = 'PackNotDeletableError';
    Object.setPrototypeOf(this, PackNotDeletableError.prototype);
  }
}
