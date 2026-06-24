import { DomainError } from './DomainError';

export class ActorNotFoundError extends DomainError {
  constructor(actorId: string) {
    super(`Actor not found: ${actorId}`);
    this.name = 'ActorNotFoundError';
    Object.setPrototypeOf(this, ActorNotFoundError.prototype);
  }
}
