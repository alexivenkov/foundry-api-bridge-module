import { defaultScriptMacroPolicy, requireScriptMacrosAllowed, type MacroType } from '@/core/macros';

/** The script gate of the macros context over the module setting, under the name its contract test knows. */
export function ensureScriptMacroAllowed(macroType: MacroType): void {
  requireScriptMacrosAllowed(macroType, defaultScriptMacroPolicy);
}
