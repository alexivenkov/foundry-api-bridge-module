import { DomainError } from '@/kernel';

export class PackDocumentNotFoundError extends DomainError {
  constructor(
    public readonly packId: string,
    public readonly documentId: string
  ) {
    super(`Document not found in pack ${packId}: ${documentId}`);
    this.name = 'PackDocumentNotFoundError';
    Object.setPrototypeOf(this, PackDocumentNotFoundError.prototype);
  }
}
