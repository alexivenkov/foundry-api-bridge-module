import { DomainError } from '@/kernel';

export class AdventureImportUnsupportedError extends DomainError {
  constructor(public readonly packId: string) {
    super('Adventure import not supported via this command — use Foundry UI for Adventures');
    this.name = 'AdventureImportUnsupportedError';
    Object.setPrototypeOf(this, AdventureImportUnsupportedError.prototype);
  }
}
