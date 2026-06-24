import { DomainError } from './DomainError';

export class RollResolutionError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'RollResolutionError';
    Object.setPrototypeOf(this, RollResolutionError.prototype);
  }
}
