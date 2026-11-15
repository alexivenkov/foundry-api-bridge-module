import { defaultScriptMacroPolicy } from '@/core/macros';
import type { ScriptCarrierPolicy } from '@/core/actors/domain';

/** Actor data that DAE runs shares the script-macro opt-in, read on every check. */
export const macroScriptCarrierPolicy: ScriptCarrierPolicy = {
  allowsScripts(): boolean {
    return defaultScriptMacroPolicy.allowsScriptMacros();
  }
};
