import { defaultScriptMacroPolicy } from '@/core/macros';
import type { ScriptCarrierPolicy } from '@/core/cards/domain';

/** Card flags that automation modules run share the script-macro opt-in, read on every check. */
export const macroScriptCarrierPolicy: ScriptCarrierPolicy = {
  allowsScripts(): boolean {
    return defaultScriptMacroPolicy.allowsScriptMacros();
  }
};
