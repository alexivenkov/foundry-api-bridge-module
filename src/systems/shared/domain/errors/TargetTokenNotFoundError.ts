import { DomainError } from './DomainError';

export class TargetTokenNotFoundError extends DomainError {
  constructor(tokenId: string) {
    super(`Target token not found: ${tokenId}`);
    this.name = 'TargetTokenNotFoundError';
    Object.setPrototypeOf(this, TargetTokenNotFoundError.prototype);
  }
}
