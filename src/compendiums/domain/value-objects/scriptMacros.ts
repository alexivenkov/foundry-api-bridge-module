import type { AdventureDocumentGroup } from '@/compendiums/domain/model/adventure';
import type { WorldDocumentRef } from '@/compendiums/domain/model/worldDirectory';
import type { ScriptMacroImportPolicy } from '@/compendiums/domain/ports/ScriptMacroImportPolicy';

export const MACRO_DOCUMENT_TYPE = 'Macro';
// `BaseMacro#type` (Foundry 13.351 / 14.368); a source without one is a chat macro, the schema's initial value.
const SCRIPT_MACRO_TYPE = 'script';

/** What a service assumes when it is built without a policy: no consent. */
export const NO_SCRIPT_CONSENT: ScriptMacroImportPolicy = { allowsScripts: () => false };

export function isScriptMacroSource(source: { readonly type?: unknown }): boolean {
  return source.type === SCRIPT_MACRO_TYPE;
}

export function plansMacros(groups: readonly AdventureDocumentGroup[]): boolean {
  return groups.some(group => group.documentType === MACRO_DOCUMENT_TYPE && group.documents.length > 0);
}

/** The groups without the given Macro documents; a group left empty disappears. */
export function withoutMacros(
  groups: readonly AdventureDocumentGroup[],
  macros: readonly WorldDocumentRef[]
): AdventureDocumentGroup[] {
  const skipped = new Set(macros.map(macro => macro.id));
  return groups.flatMap(group => {
    if (group.documentType !== MACRO_DOCUMENT_TYPE) return [group];
    const documents = group.documents.filter(document => !skipped.has(document.id));
    return documents.length > 0 ? [{ documentType: group.documentType, documents }] : [];
  });
}
