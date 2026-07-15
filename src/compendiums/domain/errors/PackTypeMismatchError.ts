import { DomainError } from '@/kernel';

export class PackTypeMismatchError extends DomainError {
  constructor(
    public readonly packId: string,
    public readonly expectedType: string,
    public readonly actualType: string
  ) {
    super(`Compendium pack is not an ${expectedType} pack: ${packId}`);
    this.name = 'PackTypeMismatchError';
    Object.setPrototypeOf(this, PackTypeMismatchError.prototype);
  }
}
