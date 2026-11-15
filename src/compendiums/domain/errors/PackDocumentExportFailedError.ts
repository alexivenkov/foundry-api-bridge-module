import { DomainError } from '@/kernel';

export class PackDocumentExportFailedError extends DomainError {
  constructor(public readonly packId: string, public readonly documentId: string) {
    super(`Failed to export document ${documentId} to compendium ${packId}`);
    this.name = 'PackDocumentExportFailedError';
    Object.setPrototypeOf(this, PackDocumentExportFailedError.prototype);
  }
}
