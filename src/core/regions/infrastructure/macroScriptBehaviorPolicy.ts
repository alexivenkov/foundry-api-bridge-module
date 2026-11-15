import { defaultScriptMacroPolicy } from '@/core/macros';
import type { ScriptBehaviorPolicy } from '@/core/regions/domain';

/** Script behaviors share the script-macro opt-in: the module's "Allow Script Macros" setting, read on every check. */
export const macroScriptBehaviorPolicy: ScriptBehaviorPolicy = {
  allowsScripts(): boolean {
    return defaultScriptMacroPolicy.allowsScriptMacros();
  }
};
