import { DomainError } from '@/kernel';

export class ImportCreationFailedError extends DomainError {
  constructor(public readonly documentId: string) {
    super(`Failed to import document: ${documentId}`);
    this.name = 'ImportCreationFailedError';
    Object.setPrototypeOf(this, ImportCreationFailedError.prototype);
  }
}
