import { DomainError } from '@/kernel';

export class GameNotAvailableError extends DomainError {
  constructor() {
    super('Game not available');
    this.name = 'GameNotAvailableError';
    Object.setPrototypeOf(this, GameNotAvailableError.prototype);
  }
}

export class NegativeWorldTimeError extends DomainError {
  constructor() {
    super('worldTime must be >= 0');
    this.name = 'NegativeWorldTimeError';
    Object.setPrototypeOf(this, NegativeWorldTimeError.prototype);
  }
}
