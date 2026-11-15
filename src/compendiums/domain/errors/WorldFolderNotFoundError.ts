import { DomainError } from '@/kernel';

export class WorldFolderNotFoundError extends DomainError {
  constructor(public readonly folderId: string) {
    super(`Folder not found: ${folderId}`);
    this.name = 'WorldFolderNotFoundError';
    Object.setPrototypeOf(this, WorldFolderNotFoundError.prototype);
  }
}
