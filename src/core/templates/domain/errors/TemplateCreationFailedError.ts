import { DomainError } from '@/kernel';

export class TemplateCreationFailedError extends DomainError {
  constructor() {
    super('Failed to create template');
    this.name = 'TemplateCreationFailedError';
    Object.setPrototypeOf(this, TemplateCreationFailedError.prototype);
  }
}
