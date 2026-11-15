import { DomainError } from '@/kernel';

export class ActorCreationCancelledError extends DomainError {
  constructor() {
    super('Actor creation was cancelled by Foundry (a module hook may have vetoed it)');
    this.name = 'ActorCreationCancelledError';
    Object.setPrototypeOf(this, ActorCreationCancelledError.prototype);
  }
}
