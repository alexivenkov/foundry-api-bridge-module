import { defaultScriptMacroPolicy } from '@/core/macros';
import type { ScriptCarrierPolicy } from '@/core/items/domain';

/** Item data that DAE / Midi-QOL run shares the script-macro opt-in, read on every check. */
export const macroScriptCarrierPolicy: ScriptCarrierPolicy = {
  allowsScripts(): boolean {
    return defaultScriptMacroPolicy.allowsScriptMacros();
  }
};
