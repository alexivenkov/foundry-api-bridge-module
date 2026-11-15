import { DomainError } from '@/kernel';

export class CombatNotFoundError extends DomainError {
  constructor(public readonly combatId: string) {
    super(`Combat not found: ${combatId}`);
    this.name = 'CombatNotFoundError';
    Object.setPrototypeOf(this, CombatNotFoundError.prototype);
  }
}

export class NoActiveCombatError extends DomainError {
  constructor() {
    super('No active combat');
    this.name = 'NoActiveCombatError';
    Object.setPrototypeOf(this, NoActiveCombatError.prototype);
  }
}

export class CombatCreationCancelledError extends DomainError {
  constructor() {
    super('Combat creation was cancelled by Foundry (a module hook may have vetoed it)');
    this.name = 'CombatCreationCancelledError';
    Object.setPrototypeOf(this, CombatCreationCancelledError.prototype);
  }
}

export class CombatAlreadyStartedError extends DomainError {
  constructor() {
    super('Combat already started');
    this.name = 'CombatAlreadyStartedError';
    Object.setPrototypeOf(this, CombatAlreadyStartedError.prototype);
  }
}

export class CombatNotStartedError extends DomainError {
  constructor() {
    super('Combat not started');
    this.name = 'CombatNotStartedError';
    Object.setPrototypeOf(this, CombatNotStartedError.prototype);
  }
}

export class CombatantNotFoundError extends DomainError {
  constructor(public readonly combatantId: string) {
    super(`Combatant not found: ${combatantId}`);
    this.name = 'CombatantNotFoundError';
    Object.setPrototypeOf(this, CombatantNotFoundError.prototype);
  }
}

export class CombatantNotInTurnOrderError extends DomainError {
  constructor(public readonly combatantId: string) {
    super(`Combatant not found in turn order: ${combatantId}`);
    this.name = 'CombatantNotInTurnOrderError';
    Object.setPrototypeOf(this, CombatantNotInTurnOrderError.prototype);
  }
}

export class CombatantCreationFailedError extends DomainError {
  constructor() {
    super('Failed to create combatant');
    this.name = 'CombatantCreationFailedError';
    Object.setPrototypeOf(this, CombatantCreationFailedError.prototype);
  }
}

export class CombatantLostError extends DomainError {
  constructor() {
    super('Failed to get updated combatant');
    this.name = 'CombatantLostError';
    Object.setPrototypeOf(this, CombatantLostError.prototype);
  }
}

export class NoCombatantIdsError extends DomainError {
  constructor() {
    super('No combatant IDs provided');
    this.name = 'NoCombatantIdsError';
    Object.setPrototypeOf(this, NoCombatantIdsError.prototype);
  }
}

export class NoCurrentCombatantError extends DomainError {
  constructor() {
    super('No current combatant');
    this.name = 'NoCurrentCombatantError';
    Object.setPrototypeOf(this, NoCurrentCombatantError.prototype);
  }
}

export class CurrentCombatantHasNoTokenError extends DomainError {
  constructor() {
    super('Current combatant has no token');
    this.name = 'CurrentCombatantHasNoTokenError';
    Object.setPrototypeOf(this, CurrentCombatantHasNoTokenError.prototype);
  }
}

/** A turn is described on the scene this client views; the wire has always called it the active scene. */
export class NoBattlefieldError extends DomainError {
  constructor() {
    super('No active scene');
    this.name = 'NoBattlefieldError';
    Object.setPrototypeOf(this, NoBattlefieldError.prototype);
  }
}

export class CurrentCombatantTokenNotFoundError extends DomainError {
  constructor(public readonly tokenId: string) {
    super(`Token not found for current combatant: ${tokenId}`);
    this.name = 'CurrentCombatantTokenNotFoundError';
    Object.setPrototypeOf(this, CurrentCombatantTokenNotFoundError.prototype);
  }
}

export class CombatantGroupNotFoundError extends DomainError {
  constructor(public readonly groupId: string) {
    super(`Combatant group not found: ${groupId}`);
    this.name = 'CombatantGroupNotFoundError';
    Object.setPrototypeOf(this, CombatantGroupNotFoundError.prototype);
  }
}

export class CombatantGroupCreationFailedError extends DomainError {
  constructor() {
    super('Failed to create combatant group');
    this.name = 'CombatantGroupCreationFailedError';
    Object.setPrototypeOf(this, CombatantGroupCreationFailedError.prototype);
  }
}

export class CombatSceneLinkRefusedError extends DomainError {
  constructor(public readonly sceneId: string) {
    super(`Cannot link the combat to scene ${sceneId}: some of its combatants are on another scene`);
    this.name = 'CombatSceneLinkRefusedError';
    Object.setPrototypeOf(this, CombatSceneLinkRefusedError.prototype);
  }
}

export class TokenAlreadyInCombatError extends DomainError {
  constructor(public readonly tokenId: string) {
    super(`Token is already in the combat: ${tokenId}`);
    this.name = 'TokenAlreadyInCombatError';
    Object.setPrototypeOf(this, TokenAlreadyInCombatError.prototype);
  }
}

export class TokenActorMismatchError extends DomainError {
  constructor(
    public readonly tokenId: string,
    public readonly actorId: string
  ) {
    super(`Token ${tokenId} does not stand for actor ${actorId}`);
    this.name = 'TokenActorMismatchError';
    Object.setPrototypeOf(this, TokenActorMismatchError.prototype);
  }
}

export class UnknownTurnMarkerAnimationError extends DomainError {
  constructor(
    public readonly animation: string,
    public readonly known: readonly string[]
  ) {
    super(`Unknown turn marker animation: ${animation} (known: ${known.join(', ')})`);
    this.name = 'UnknownTurnMarkerAnimationError';
    Object.setPrototypeOf(this, UnknownTurnMarkerAnimationError.prototype);
  }
}
