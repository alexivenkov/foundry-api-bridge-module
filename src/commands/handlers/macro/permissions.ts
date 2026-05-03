import { getAllowScriptMacros } from '@/settings/SettingsManager';

export function ensureScriptMacroAllowed(macroType: 'chat' | 'script'): void {
  if (macroType !== 'script') return;
  if (!getAllowScriptMacros()) {
    throw new Error(
      'Script macros are disabled. Enable "Allow Script Macros" in module settings to manage script-type macros via API.'
    );
  }
}
