import { DomainError } from '@/kernel';

export class RollTableCreationCancelledError extends DomainError {
  constructor() {
    super('Roll table creation was cancelled by Foundry (a module hook may have vetoed it)');
    this.name = 'RollTableCreationCancelledError';
    Object.setPrototypeOf(this, RollTableCreationCancelledError.prototype);
  }
}
