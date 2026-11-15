import { DomainError } from '@/kernel';

export class FolderCreationCancelledError extends DomainError {
  constructor() {
    super('Folder creation was cancelled by Foundry (a module hook may have vetoed it)');
    this.name = 'FolderCreationCancelledError';
    Object.setPrototypeOf(this, FolderCreationCancelledError.prototype);
  }
}
