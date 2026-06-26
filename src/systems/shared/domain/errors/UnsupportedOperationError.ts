import { DomainError } from './DomainError';

/**
 * Thrown by a per-system gateway when a roll/action exists in the neutral
 * contract but is not supported by the active game system (e.g. bare ability
 * checks in PF2e).
 */
export class UnsupportedOperationError extends DomainError {
  constructor(operation: string, systemId: string) {
    super(`Operation '${operation}' is not supported by game system '${systemId}'`);
    this.name = 'UnsupportedOperationError';
    Object.setPrototypeOf(this, UnsupportedOperationError.prototype);
  }
}
