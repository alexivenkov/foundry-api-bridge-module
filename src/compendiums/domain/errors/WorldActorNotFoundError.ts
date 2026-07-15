import { DomainError } from '@/kernel';

export class WorldActorNotFoundError extends DomainError {
  constructor(public readonly actorId: string) {
    super(`Actor not found: ${actorId}`);
    this.name = 'WorldActorNotFoundError';
    Object.setPrototypeOf(this, WorldActorNotFoundError.prototype);
  }
}
