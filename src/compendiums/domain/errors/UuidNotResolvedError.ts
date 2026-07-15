import { DomainError } from '@/kernel';

export class UuidNotResolvedError extends DomainError {
  constructor(public readonly uuid: string) {
    super(`Document not found for UUID: ${uuid}`);
    this.name = 'UuidNotResolvedError';
    Object.setPrototypeOf(this, UuidNotResolvedError.prototype);
  }
}
