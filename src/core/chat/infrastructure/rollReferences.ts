import { isV14Plus } from '@/compat/foundryVersion';

/**
 * The references `Roll.replaceFormulaData` substitutes: `@path` up to Foundry
 * 13 (verified on 13.351), `@path` or `@{path}` since 14 (verified on 14.368).
 * A fresh expression per call, since a global one keeps its position.
 */
function referencePattern(): RegExp {
  return isV14Plus() ? /@\{[-.\w]+\}|@[-.\w]+/g : /@[a-z.0-9_-]+/gi;
}

/** Each reference once, in the order it first appears. */
export function findRollReferences(formula: string): string[] {
  return [...new Set(formula.match(referencePattern()) ?? [])];
}
