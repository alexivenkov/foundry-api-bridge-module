import { DomainError } from '@/kernel';

export class RegionNotFoundError extends DomainError {
  constructor(public readonly regionId: string) {
    super(`Region not found: ${regionId}`);
    this.name = 'RegionNotFoundError';
    Object.setPrototypeOf(this, RegionNotFoundError.prototype);
  }
}

export class RegionCreationFailedError extends DomainError {
  constructor() {
    super('Failed to create region');
    this.name = 'RegionCreationFailedError';
    Object.setPrototypeOf(this, RegionCreationFailedError.prototype);
  }
}

export class RegionBehaviorNotFoundError extends DomainError {
  constructor(public readonly behaviorId: string) {
    super(`Region behavior not found: ${behaviorId}`);
    this.name = 'RegionBehaviorNotFoundError';
    Object.setPrototypeOf(this, RegionBehaviorNotFoundError.prototype);
  }
}

export class RegionBehaviorCreationFailedError extends DomainError {
  constructor() {
    super('Failed to create region behavior');
    this.name = 'RegionBehaviorCreationFailedError';
    Object.setPrototypeOf(this, RegionBehaviorCreationFailedError.prototype);
  }
}

export class UnregisteredBehaviorTypeError extends DomainError {
  constructor(
    public readonly behaviorType: string,
    registered: readonly string[]
  ) {
    super(`Region behavior type '${behaviorType}' is not registered in this world (registered: ${registered.join(', ')})`);
    this.name = 'UnregisteredBehaviorTypeError';
    Object.setPrototypeOf(this, UnregisteredBehaviorTypeError.prototype);
  }
}

export class ScriptBehaviorsDisabledError extends DomainError {
  constructor() {
    super(
      'Script macros are disabled. Enable "Allow Script Macros" in module settings to manage executeScript region behaviors via API.'
    );
    this.name = 'ScriptBehaviorsDisabledError';
    Object.setPrototypeOf(this, ScriptBehaviorsDisabledError.prototype);
  }
}

/** An executeMacro target that resolves to no Macro (the core would store it and fail at run time). */
export class RegionMacroNotFoundError extends DomainError {
  constructor(public readonly macroUuid: string) {
    super(`Macro not found: ${macroUuid}`);
    this.name = 'RegionMacroNotFoundError';
    Object.setPrototypeOf(this, RegionMacroNotFoundError.prototype);
  }
}

/** An executeMacro behavior aimed at a script macro: the refusal text of the macros context. */
export class ScriptMacroTargetDisabledError extends DomainError {
  constructor() {
    super(
      'Script macros are disabled. Enable "Allow Script Macros" in module settings to manage script-type macros via API.'
    );
    this.name = 'ScriptMacroTargetDisabledError';
    Object.setPrototypeOf(this, ScriptMacroTargetDisabledError.prototype);
  }
}

export class RegionTokenNotFoundError extends DomainError {
  constructor(public readonly tokenId: string) {
    super(`Token not found: ${tokenId}`);
    this.name = 'RegionTokenNotFoundError';
    Object.setPrototypeOf(this, RegionTokenNotFoundError.prototype);
  }
}

export class RegionLevelNotFoundError extends DomainError {
  constructor(public readonly levelId: string) {
    super(`Level not found: ${levelId}`);
    this.name = 'RegionLevelNotFoundError';
    Object.setPrototypeOf(this, RegionLevelNotFoundError.prototype);
  }
}

/** Foundry 14: a wall-restricted region whose clipped shape no GM client has computed yet. */
export class RegionShapeNotComputedError extends DomainError {
  constructor(public readonly regionId: string) {
    super(
      `Region ${regionId} is restricted by walls and its shape has not been computed yet; a GM client computes it while viewing the region's level`
    );
    this.name = 'RegionShapeNotComputedError';
    Object.setPrototypeOf(this, RegionShapeNotComputedError.prototype);
  }
}

export class RegionPointTestUnavailableError extends DomainError {
  constructor() {
    super('Region point tests are not available in this Foundry client');
    this.name = 'RegionPointTestUnavailableError';
    Object.setPrototypeOf(this, RegionPointTestUnavailableError.prototype);
  }
}
