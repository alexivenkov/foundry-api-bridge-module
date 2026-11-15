import { DomainError } from '@/kernel';

/** Worded as the macros context's `ScriptMacrosDisabledError`, which this context may not import. */
export class ScriptMacroImportDisabledError extends DomainError {
  constructor() {
    super(
      'Script macros are disabled. Enable "Allow Script Macros" in module settings to manage script-type macros via API.'
    );
    this.name = 'ScriptMacroImportDisabledError';
    Object.setPrototypeOf(this, ScriptMacroImportDisabledError.prototype);
  }
}
