import { DomainError } from '@/kernel';

export class TokenNotFoundError extends DomainError {
  constructor(public readonly tokenId: string) {
    super(`Token not found: ${tokenId}`);
    this.name = 'TokenNotFoundError';
    Object.setPrototypeOf(this, TokenNotFoundError.prototype);
  }
}

export class ActorTokenNotFoundError extends DomainError {
  constructor(
    public readonly actorId: string,
    public readonly sceneId: string
  ) {
    super(`No token for actor ${actorId} on scene ${sceneId}`);
    this.name = 'ActorTokenNotFoundError';
    Object.setPrototypeOf(this, ActorTokenNotFoundError.prototype);
  }
}

export class TokenCreationFailedError extends DomainError {
  constructor() {
    super('Failed to create token');
    this.name = 'TokenCreationFailedError';
    Object.setPrototypeOf(this, TokenCreationFailedError.prototype);
  }
}

export class PathBlockedError extends DomainError {
  constructor() {
    super('Path blocked — no valid route to destination');
    this.name = 'PathBlockedError';
    Object.setPrototypeOf(this, PathBlockedError.prototype);
  }
}

export class TokenLostError extends DomainError {
  constructor() {
    super('Token lost during movement');
    this.name = 'TokenLostError';
    Object.setPrototypeOf(this, TokenLostError.prototype);
  }
}

export class CanvasTokensUnavailableError extends DomainError {
  constructor() {
    super('Canvas tokens layer not available');
    this.name = 'CanvasTokensUnavailableError';
    Object.setPrototypeOf(this, CanvasTokensUnavailableError.prototype);
  }
}

export class TokenNotOnCanvasError extends DomainError {
  constructor(public readonly tokenId: string) {
    super(`Token not found on canvas: ${tokenId}`);
    this.name = 'TokenNotOnCanvasError';
    Object.setPrototypeOf(this, TokenNotOnCanvasError.prototype);
  }
}
