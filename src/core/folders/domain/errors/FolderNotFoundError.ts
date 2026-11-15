import { DomainError } from '@/kernel';

export class FolderNotFoundError extends DomainError {
  constructor(public readonly folderId: string) {
    super(`Folder not found: ${folderId}`);
    this.name = 'FolderNotFoundError';
    Object.setPrototypeOf(this, FolderNotFoundError.prototype);
  }
}
