import { DomainError, ValidationError } from '@/kernel';

export class MacroNotFoundError extends DomainError {
  constructor(public readonly macroId: string) {
    super(`Macro not found: ${macroId}`);
    this.name = 'MacroNotFoundError';
    Object.setPrototypeOf(this, MacroNotFoundError.prototype);
  }
}

export class MacroCreationCancelledError extends DomainError {
  constructor() {
    super('Macro creation was cancelled by Foundry (a module hook may have vetoed it)');
    this.name = 'MacroCreationCancelledError';
    Object.setPrototypeOf(this, MacroCreationCancelledError.prototype);
  }
}

export class ScriptMacrosDisabledError extends DomainError {
  constructor() {
    super(
      'Script macros are disabled. Enable "Allow Script Macros" in module settings to manage script-type macros via API.'
    );
    this.name = 'ScriptMacrosDisabledError';
    Object.setPrototypeOf(this, ScriptMacrosDisabledError.prototype);
  }
}

export class InvalidMacroArgumentsError extends ValidationError {
  constructor() {
    super('args must be a JSON object');
    this.name = 'InvalidMacroArgumentsError';
    Object.setPrototypeOf(this, InvalidMacroArgumentsError.prototype);
  }
}

export class MacroSyntaxError extends DomainError {
  constructor(
    public readonly macroName: string,
    public readonly detail: string
  ) {
    super(`Macro "${macroName}" has a syntax error: ${detail}`);
    this.name = 'MacroSyntaxError';
    Object.setPrototypeOf(this, MacroSyntaxError.prototype);
  }
}

export class MacroExecutionFailedError extends DomainError {
  constructor(
    public readonly macroName: string,
    public readonly detail: string
  ) {
    super(`Macro "${macroName}" failed: ${detail}`);
    this.name = 'MacroExecutionFailedError';
    Object.setPrototypeOf(this, MacroExecutionFailedError.prototype);
  }
}

export class MacroActorNotFoundError extends DomainError {
  constructor(public readonly actorId: string) {
    super(`Actor not found: ${actorId}`);
    this.name = 'MacroActorNotFoundError';
    Object.setPrototypeOf(this, MacroActorNotFoundError.prototype);
  }
}

export class MacroTokenNotFoundError extends DomainError {
  constructor(public readonly tokenId: string) {
    super(`Token not found on active scene: ${tokenId}`);
    this.name = 'MacroTokenNotFoundError';
    Object.setPrototypeOf(this, MacroTokenNotFoundError.prototype);
  }
}
