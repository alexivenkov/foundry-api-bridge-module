import { DomainError } from '@/kernel';

export class WorldDocumentClassUnavailableError extends DomainError {
  constructor(public readonly documentType: string) {
    super(`Document class not available for type: ${documentType}`);
    this.name = 'WorldDocumentClassUnavailableError';
    Object.setPrototypeOf(this, WorldDocumentClassUnavailableError.prototype);
  }
}
