import { DomainError, ValidationError } from '@/kernel';

/** The core lets only the user who started a movement stop or pause it. */
export class MovementStartedElsewhereError extends DomainError {
  constructor(action: 'stop' | 'pause', userName: string | null) {
    super(
      `Only the user who started the movement can ${action} it` + (userName !== null ? ` (started by ${userName})` : '')
    );
    this.name = 'MovementStartedElsewhereError';
    Object.setPrototypeOf(this, MovementStartedElsewhereError.prototype);
  }
}

export class NoTokenMovementError extends DomainError {
  constructor(public readonly tokenId: string) {
    super(`Token ${tokenId} has no movement to resume`);
    this.name = 'NoTokenMovementError';
    Object.setPrototypeOf(this, NoTokenMovementError.prototype);
  }
}

export class RecordedMovementNotFoundError extends DomainError {
  constructor(public readonly movementId: string) {
    super(`Movement not found: ${movementId}`);
    this.name = 'RecordedMovementNotFoundError';
    Object.setPrototypeOf(this, RecordedMovementNotFoundError.prototype);
  }
}

export class MovementCombatNotFoundError extends DomainError {
  constructor(public readonly combatId: string) {
    super(`Combat not found: ${combatId}`);
    this.name = 'MovementCombatNotFoundError';
    Object.setPrototypeOf(this, MovementCombatNotFoundError.prototype);
  }
}

export class HistoryScopeConflictError extends ValidationError {
  constructor() {
    super('tokenId and combatId cannot be set together');
    this.name = 'HistoryScopeConflictError';
    Object.setPrototypeOf(this, HistoryScopeConflictError.prototype);
  }
}
