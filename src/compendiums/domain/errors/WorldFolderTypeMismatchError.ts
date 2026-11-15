import { DomainError } from '@/kernel';

export class WorldFolderTypeMismatchError extends DomainError {
  constructor(public readonly folderId: string, actualType: string, expectedType: string) {
    super(`Folder ${folderId} is of type ${actualType}; expected ${expectedType}`);
    this.name = 'WorldFolderTypeMismatchError';
    Object.setPrototypeOf(this, WorldFolderTypeMismatchError.prototype);
  }
}
