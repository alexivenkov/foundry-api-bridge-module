import { DomainError } from '@/kernel';

export class TemplateAuthorNotFoundError extends DomainError {
  constructor(public readonly userId: string) {
    super(`User not found: ${userId}`);
    this.name = 'TemplateAuthorNotFoundError';
    Object.setPrototypeOf(this, TemplateAuthorNotFoundError.prototype);
  }
}
