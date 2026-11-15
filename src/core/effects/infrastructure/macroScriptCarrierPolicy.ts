import { defaultScriptMacroPolicy } from '@/core/macros';
import type { ScriptCarrierPolicy } from '@/core/effects/domain';

/** Effect data that DAE / Midi-QOL run shares the script-macro opt-in, read on every check. */
export const macroScriptCarrierPolicy: ScriptCarrierPolicy = {
  allowsScripts(): boolean {
    return defaultScriptMacroPolicy.allowsScriptMacros();
  }
};
