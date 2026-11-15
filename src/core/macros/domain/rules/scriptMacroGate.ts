import { ScriptMacrosDisabledError } from '@/core/macros/domain/errors/macroErrors';
import type { MacroType } from '@/core/macros/domain/model/Macro';
import type { ScriptMacroPolicy } from '@/core/macros/domain/ports/ports';

/**
 * Creating, changing and running a script macro needs the world's consent.
 * A chat macro never asks for it, so the policy is not even consulted.
 */
export function requireScriptMacrosAllowed(type: MacroType | undefined, policy: ScriptMacroPolicy): void {
  if (type === 'script' && !policy.allowsScriptMacros()) {
    throw new ScriptMacrosDisabledError();
  }
}
