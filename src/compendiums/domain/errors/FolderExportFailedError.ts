import { DomainError } from '@/kernel';

export class FolderExportFailedError extends DomainError {
  constructor(public readonly packId: string, public readonly folderId: string) {
    super(`Failed to export folder ${folderId} to compendium ${packId}`);
    this.name = 'FolderExportFailedError';
    Object.setPrototypeOf(this, FolderExportFailedError.prototype);
  }
}
