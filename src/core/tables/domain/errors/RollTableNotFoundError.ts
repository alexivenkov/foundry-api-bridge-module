import { DomainError } from '@/kernel';

export class RollTableNotFoundError extends DomainError {
  constructor(public readonly tableId: string) {
    super(`Roll table not found: ${tableId}`);
    this.name = 'RollTableNotFoundError';
    Object.setPrototypeOf(this, RollTableNotFoundError.prototype);
  }
}
