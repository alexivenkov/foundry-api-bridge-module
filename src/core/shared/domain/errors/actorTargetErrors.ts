import { DomainError } from '@/kernel';

export class ActorNotFoundError extends DomainError {
  constructor(public readonly actorId: string) {
    super(`Actor not found: ${actorId}`);
    this.name = 'ActorNotFoundError';
    Object.setPrototypeOf(this, ActorNotFoundError.prototype);
  }
}

export class ActorTargetRequiredError extends DomainError {
  constructor() {
    super('Either actorId or tokenId is required');
    this.name = 'ActorTargetRequiredError';
    Object.setPrototypeOf(this, ActorTargetRequiredError.prototype);
  }
}

/** The token an actor target named is not on the scene. */
export class TargetTokenNotFoundError extends DomainError {
  constructor(public readonly tokenId: string) {
    super(`Token not found: ${tokenId}`);
    this.name = 'TargetTokenNotFoundError';
    Object.setPrototypeOf(this, TargetTokenNotFoundError.prototype);
  }
}

export class TokenHasNoActorError extends DomainError {
  constructor(public readonly tokenId: string) {
    super(`Token has no actor: ${tokenId}`);
    this.name = 'TokenHasNoActorError';
    Object.setPrototypeOf(this, TokenHasNoActorError.prototype);
  }
}
