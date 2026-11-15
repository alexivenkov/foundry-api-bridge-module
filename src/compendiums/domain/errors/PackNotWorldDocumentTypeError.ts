import { DomainError } from '@/kernel';

export class PackNotWorldDocumentTypeError extends DomainError {
  constructor(
    public readonly packId: string,
    public readonly documentType: string
  ) {
    super(
      documentType === 'Adventure'
        ? `Compendium pack ${packId} holds Adventure documents, which are not world documents; use import-adventure`
        : `Compendium pack ${packId} holds ${documentType} documents, which are not world documents`
    );
    this.name = 'PackNotWorldDocumentTypeError';
    Object.setPrototypeOf(this, PackNotWorldDocumentTypeError.prototype);
  }
}
