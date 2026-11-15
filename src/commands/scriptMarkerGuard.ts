import { findFormulaScriptMarkers, refuseScriptCarriers } from '@/kernel';
import { getAllowScriptMacros } from '@/settings/SettingsManager';
import type { Command } from '@/commands/types';

/**
 * Refuses, without the "Allow Script Macros" opt-in, any command whose params carry DAE's `dae.eval(` marker:
 * with DAE active it turns a dice formula or an inline roll in chat / journal text into JavaScript, so no single
 * context can guard it. The setting is read only when a marker is present.
 */
export function createScriptMarkerGuard(
  allowsScripts: () => boolean = getAllowScriptMacros
): (command: Command) => void {
  return (command) => {
    refuseScriptCarriers(findFormulaScriptMarkers(command.params), allowsScripts);
  };
}
