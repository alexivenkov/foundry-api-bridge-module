import { DomainError } from './DomainError';

export class ActivityResolutionError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'ActivityResolutionError';
    Object.setPrototypeOf(this, ActivityResolutionError.prototype);
  }
}
