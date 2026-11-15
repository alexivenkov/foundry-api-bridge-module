import type { ScriptMacroPolicy } from '@/core/macros/domain';
import { getAllowScriptMacros } from '@/settings/SettingsManager';

/** The module's "Allow Script Macros" world setting, read on every check: the GM may flip it at any time. */
export const moduleSettingScriptMacroPolicy: ScriptMacroPolicy = {
  allowsScriptMacros(): boolean {
    return getAllowScriptMacros();
  }
};
