import { DomainError } from '@/kernel';

export class ImportFolderCreationFailedError extends DomainError {
  constructor(public readonly packId: string) {
    super(`Failed to create the world folder to import compendium pack ${packId} into`);
    this.name = 'ImportFolderCreationFailedError';
    Object.setPrototypeOf(this, ImportFolderCreationFailedError.prototype);
  }
}
