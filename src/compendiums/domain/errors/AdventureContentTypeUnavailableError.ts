import { DomainError } from '@/kernel';

export class AdventureContentTypeUnavailableError extends DomainError {
  constructor(public readonly documentType: string) {
    super(`Adventure content type ${documentType} is not available in this Foundry version`);
    this.name = 'AdventureContentTypeUnavailableError';
    Object.setPrototypeOf(this, AdventureContentTypeUnavailableError.prototype);
  }
}
