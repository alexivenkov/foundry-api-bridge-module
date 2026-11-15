import { DomainError } from '@/kernel';

export class TemplateNotFoundError extends DomainError {
  constructor(public readonly templateId: string) {
    super(`Template not found: ${templateId}`);
    this.name = 'TemplateNotFoundError';
    Object.setPrototypeOf(this, TemplateNotFoundError.prototype);
  }
}
