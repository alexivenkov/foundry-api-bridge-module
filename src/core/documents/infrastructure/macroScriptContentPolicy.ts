import { defaultScriptMacroPolicy } from '@/core/macros';
import type { ScriptContentPolicy } from '@/core/documents/domain';

/** Imported scripts share the script-macro opt-in: the module's "Allow Script Macros" setting, read on every check. */
export const macroScriptContentPolicy: ScriptContentPolicy = {
  allowsScripts(): boolean {
    return defaultScriptMacroPolicy.allowsScriptMacros();
  }
};
