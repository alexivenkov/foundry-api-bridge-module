import { DomainError } from '@/kernel';

export class WorldDocumentNotFoundError extends DomainError {
  constructor(public readonly documentType: string, public readonly documentId: string) {
    super(`${documentType} not found: ${documentId}`);
    this.name = 'WorldDocumentNotFoundError';
    Object.setPrototypeOf(this, WorldDocumentNotFoundError.prototype);
  }
}
