import { DomainError } from './DomainError';

export class UnsupportedSystemError extends DomainError {
  constructor(systemId: string) {
    super(`Unsupported game system: '${systemId}'`);
    this.name = 'UnsupportedSystemError';
    Object.setPrototypeOf(this, UnsupportedSystemError.prototype);
  }
}
