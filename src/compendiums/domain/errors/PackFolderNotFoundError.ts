import { DomainError } from '@/kernel';

export class PackFolderNotFoundError extends DomainError {
  constructor(public readonly packId: string, public readonly folderId: string) {
    super(`Folder not found in pack ${packId}: ${folderId}`);
    this.name = 'PackFolderNotFoundError';
    Object.setPrototypeOf(this, PackFolderNotFoundError.prototype);
  }
}
