import { DAE_EVAL_MARKER } from './automationCatalogue';
import type { ScriptCarrier } from './findScriptCarriers';

/**
 * Every string in a command's params that holds DAE's `dae.eval(` marker, wherever it sits. DAE wraps
 * `Roll.replaceFormulaData` for the whole client (`libWrapper.register("dae", "Roll.replaceFormulaData", …)`,
 * DAE 14.0.19 `dae.js`), so the marker runs JavaScript in any dice formula, in an inline roll of chat or
 * journal text when a client renders it, and in every stored formula — not only in the document fields
 * `findScriptCarriers` knows. Matched exactly as DAE does (`formula.includes("dae.eval(")`).
 */
export function findFormulaScriptMarkers(params: unknown, path = 'params'): ScriptCarrier[] {
  if (typeof params === 'string') {
    return params.includes(DAE_EVAL_MARKER)
      ? [{ path, module: 'DAE', runs: 'JavaScript', identity: `${path}=${params}` }]
      : [];
  }
  if (Array.isArray(params)) {
    return params.flatMap((value, index) => findFormulaScriptMarkers(value, `${path}.${String(index)}`));
  }
  if (typeof params === 'object' && params !== null) {
    return Object.entries(params).flatMap(([key, value]) => findFormulaScriptMarkers(value, `${path}.${key}`));
  }
  return [];
}
